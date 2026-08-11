import 'mapbox-gl-v3/dist/mapbox-gl.css';

import {
    useEffect,
    useRef,
} from 'react';
import { _cs } from '@togglecorp/fujs';
import mapboxgl from 'mapbox-gl-v3';

import {
    mbtoken,
    nrwStandalone,
} from '#config';
import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type Latitude,
    type Longitude,
    type MapViewChangeHandler,
    type Zoom,
} from '#views/CountryProfileNationalRiskWatch/types';

import styles from './styles.module.css';

// Get this from Mapbox Studio > Styles > Style url
const NRW_MAPBOX_STYLE_URL = 'mapbox://styles/510global/cmrls7huy001501sde6mdhzlk';

export default function NrwMap(props: {
    zoom: Zoom;
    center: NrwLngLat;
    onMapViewChange: MapViewChangeHandler;
}) {
    const {
        zoom,
        center,
        onMapViewChange,
    } = props;

    // The element inside of which the map will be rendered.
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize the Mapbox map instance
    useEffect(() => {
        if (!containerRef.current) {
            return undefined;
        }

        mapboxgl.accessToken = mbtoken;

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: NRW_MAPBOX_STYLE_URL,
            projection: 'mercator',
            attributionControl: true,
            center,
            zoom,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

        map.on('moveend', () => {
            onMapViewChange(
                map.getZoom() as Zoom,
                map.getCenter().lat as Latitude,
                map.getCenter().lng as Longitude,
            );
        });

        // Cleanup.
        return () => {
            map?.remove();
        };
    // Set the dependencies to empty since we want this to run exactly once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={containerRef}
            className={_cs(
                styles.nrwMap,
                nrwStandalone && styles.nrwStandalone,
            )}
        />
    );
}
