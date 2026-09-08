import 'mapbox-gl-v3/dist/mapbox-gl.css';

import {
    useEffect,
    useRef,
    useState,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';
import mapboxgl, { type Map as MapboxMap } from 'mapbox-gl-v3';

import { mbtoken } from '#config';
import { type NrwRasterLayerDetails } from '#views/CountryProfileNationalRiskWatch/hooks/useNrwLayers';
import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type Latitude,
    type Longitude,
    type MapView,
    type MapViewChangeHandler,
    type Zoom,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwMapMarkerPortal from './NrwMapMarkerPortal';
import syncRasterLayers from './utils';

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
    rasterLayerDetails?: NrwRasterLayerDetails[];
}) {
    const {
        mapView,
        onMapViewChange,
        markers,
        rasterLayerDetails,
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
    const loadedRasterIdsRef = useRef<Set<string>>(new Set());

    // Initialize the Mapbox map instance
    useEffect(() => {
        if (!containerRef.current) {
            return undefined;
        }

        const loadedRasterIds = loadedRasterIdsRef.current;

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
            loadedRasterIds.clear();
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

    // Sync the raster overlays with the map
    useEffect(() => {
        if (!mapboxMap || !mapLoadComplete) {
            return;
        }

        syncRasterLayers(mapboxMap, rasterLayerDetails ?? [], loadedRasterIdsRef.current);
    }, [mapboxMap, mapLoadComplete, rasterLayerDetails]);

    return (
        <>
            <div
                ref={containerRef}
                className={styles.nrwMapContainer}
            />
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
