import 'mapbox-gl-v3/dist/mapbox-gl.css';

import {
    Children,
    isValidElement,
    useEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import { _cs } from '@togglecorp/fujs';
import mapboxgl, {
    type Map as MapboxMap,
    type Marker as MapboxMarker,
} from 'mapbox-gl-v3';

import {
    mbtoken,
    nrwStandalone,
} from '#config';
import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type InitialMapView,
    type Latitude,
    type Longitude,
    type MapViewChangeHandler,
    type Zoom,
} from '#views/CountryProfileNationalRiskWatch/types';

import styles from './styles.module.css';

// This component wraps Mapbox so the rest of the components don't need to know
// about Mapbox.
// This component does not know about URLs or network requests.

// Get this from Mapbox Studio > Styles > Style url
const nrwMapboxStyleUrl = 'mapbox://styles/510global/cmrls7huy001501sde6mdhzlk';
const paddingPixels = 20;

interface MarkerEntry {
    marker: MapboxMarker;
    element: HTMLDivElement;
    coordinates: NrwLngLat;
    reactElement: React.ReactElement;
}

function NrwMapContainer(props: {
    initialMapView: InitialMapView;
    onMapViewChange: MapViewChangeHandler;
    markers?: React.ReactNode;
}) {
    const {
        initialMapView,
        onMapViewChange,
        markers,
    } = props;

    const {
        zoom,
        center,
        fitBounds,
    } = initialMapView;

    // The element inside of which the map will be rendered.
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapboxMap>(undefined);
    const markerEntriesRef = useRef<Map<string, MarkerEntry>>(new Map());
    // Marker entries live in state so React renders their portal contents;
    // the mapboxgl.Marker objects are only mutated, never recreated on
    // marker changes.
    const [markerEntries, setMarkerEntries] = useState<Map<string, MarkerEntry>>(new Map());
    const [mapReady, setMapReady] = useState(false);

    // Initialize the Mapbox map instance
    useEffect(() => {
        if (!containerRef.current) {
            return undefined;
        }

        mapboxgl.accessToken = mbtoken;

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: nrwMapboxStyleUrl,
            projection: 'mercator',
            attributionControl: true,
            center,
            zoom,
        });

        // If country bounds were provided, fit the map to these.
        if (fitBounds) {
            map.fitBounds(fitBounds, { padding: paddingPixels });
        }

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

        map.on('moveend', () => {
            onMapViewChange(
                map.getZoom() as Zoom,
                map.getCenter().lat as Latitude,
                map.getCenter().lng as Longitude,
            );
        });

        mapRef.current = map;
        setMapReady(true);

        // Cleanup.
        return () => {
            setMapReady(false);
            mapRef.current = undefined;
            markerEntriesRef.current.forEach((entry) => entry.marker.remove());
            markerEntriesRef.current = new Map();
            setMarkerEntries(new Map());
            map.remove();
        };
    // Set the dependencies to empty since we want this to run exactly once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync markers with the map. Independent from map creation so marker
    // changes never recreate the map.
    useEffect(() => {
        const map = mapRef.current;
        if (!mapReady || !map) {
            return;
        }

        const prev = markerEntriesRef.current;
        const next = new Map<string, MarkerEntry>();

        Children.toArray(markers).forEach((child) => {
            if (!isValidElement<{ id: string; coordinates: NrwLngLat }>(child)) {
                return;
            }

            const { id, coordinates } = child.props;
            if (!id || !coordinates) {
                return;
            }

            const existing = prev.get(id);
            if (existing) {
                if (!existing.coordinates.equals(coordinates)) {
                    existing.marker.setLngLat(coordinates);
                    existing.coordinates = coordinates;
                }
                existing.reactElement = child;
                next.set(id, existing);
                return;
            }

            const element = document.createElement('div');
            const marker = new mapboxgl.Marker({
                element,
                anchor: 'bottom',
            })
                .setLngLat(coordinates)
                .addTo(map);

            next.set(id, {
                marker,
                element,
                coordinates,
                reactElement: child,
            });
        });

        prev.forEach((entry, id) => {
            if (!next.has(id)) {
                entry.marker.remove();
            }
        });

        markerEntriesRef.current = next;
        setMarkerEntries(next);
    }, [markers, mapReady]);

    return (
        <>
            <div
                ref={containerRef}
                className={_cs(
                    styles.nrwMapContainer,
                    nrwStandalone && styles.nrwStandalone,
                )}
            />
            {[...markerEntries].map(
                ([id, entry]) => createPortal(entry.reactElement, entry.element, id),
            )}
        </>
    );
}

export default NrwMapContainer;
