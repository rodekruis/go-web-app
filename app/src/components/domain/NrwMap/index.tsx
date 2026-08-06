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
import {
    NrwMapCenter,
    NrwMapZoom,
} from '#views/CountryProfileNationalRiskWatch/utils';

import styles from './styles.module.css';

// Get this from Mapbox Studio > Styles > Style url
const NRW_MAPBOX_STYLE_URL = 'mapbox://styles/510global/cmrls7huy001501sde6mdhzlk';

export default function NrwMap(props: {
    zoom: NrwMapZoom;
    center: NrwMapCenter;
    onMapViewChange: (newZoom: NrwMapZoom, newCenter: NrwMapCenter) => void;
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
            zoom: zoom.value,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

        map.on('moveend', () => {
            onMapViewChange(
                NrwMapZoom.fromMapboxGLMap(map),
                NrwMapCenter.fromMapboxGLMap(map),
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
