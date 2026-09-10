import 'mapbox-gl-v3/dist/mapbox-gl.css';

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';
import mapboxgl, { type Map as MapboxMap } from 'mapbox-gl-v3';

import { mbtoken } from '#config';
import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type Latitude,
    type Longitude,
    type MapView,
    type MapViewChangeHandler,
    type Zoom,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwMapContext from '../NrwMapContext';
import NrwMapMarkerPortal from './NrwMapMarkerPortal';

import styles from './styles.module.css';

// This component wraps Mapbox so the rest of the components don't need to know
// about Mapbox.
// This component does not know about URLs or network requests.

// Get this from Mapbox Studio > Styles > Style url
const nrwMapboxStyleUrl = 'mapbox://styles/510global/cmrls7huy001501sde6mdhzlk';
const paddingPixels = 20;

export interface NrwMapMarker {
    id: string;
    coordinates: NrwLngLat;
    content: React.ReactNode;
}

function NrwMapContainer(props: {
    mapView: MapView;
    onMapViewChange: MapViewChangeHandler;
    markers?: NrwMapMarker[];
    children?: React.ReactNode;
}) {
    const {
        mapView, onMapViewChange, markers, children,
    } = props;

    const {
        zoom,
        center,
        fitBounds,
    } = mapView;

    const [southWest, northEast] = fitBounds ?? [];

    const containerRef = useRef<HTMLDivElement>(null);
    const [mapboxMap, setMapboxMap] = useState<MapboxMap | undefined>(undefined);
    const [mapLoadComplete, setMapLoadComplete] = useState(false);

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

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

        map.on('style.load', () => {
            setMapLoadComplete(true);
        });

        map.on('moveend', () => {
            onMapViewChange(
                map.getZoom() as Zoom,
                map.getCenter().lat as Latitude,
                map.getCenter().lng as Longitude,
            );
        });

        setMapboxMap(map);

        // Cleanup.
        return () => {
            setMapboxMap(undefined);
            setMapLoadComplete(false);
            map.remove();
        };
    // Set the dependencies to empty since we want this to run exactly once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // The country bounds arrive after the map is created.
    useEffect(() => {
        if (isNotDefined(mapboxMap) || isNotDefined(fitBounds)) {
            return;
        }

        mapboxMap.fitBounds(fitBounds, { padding: paddingPixels, animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapboxMap, southWest?.lng, southWest?.lat, northEast?.lng, northEast?.lat]);

    const mapContext = useMemo(
        () => ({ map: mapLoadComplete ? mapboxMap : undefined }),
        [mapboxMap, mapLoadComplete],
    );

    return (
        <>
            <div
                ref={containerRef}
                className={styles.nrwMapContainer}
            />
            <NrwMapContext.Provider value={mapContext}>
                {children}
            </NrwMapContext.Provider>
            {markers?.map(
                ({ id, coordinates, content }) => (
                    <NrwMapMarkerPortal
                        key={id}
                        mapboxMap={mapboxMap}
                        coordinates={coordinates}
                    >
                        {content}
                    </NrwMapMarkerPortal>
                ),
            )}
        </>
    );
}

export default NrwMapContainer;
