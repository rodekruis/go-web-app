import 'mapbox-gl-v3/dist/mapbox-gl.css';

import {
    useEffect,
    useRef,
} from 'react';
import mapboxgl, { type Map as MapboxGLMap } from 'mapbox-gl-v3';

import { mbtoken } from '#config';
import {
    defaultMapZoom,
    NRW_MAPBOX_STYLE_URL,
} from '#utils/domain/nrw';

import styles from './styles.module.css';

export default function NrwMap() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<MapboxGLMap | null>(null);

    // Initialize the Mapbox map instance
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) {
            return undefined;
        }

        mapboxgl.accessToken = mbtoken;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: NRW_MAPBOX_STYLE_URL,
            projection: 'mercator',
            attributionControl: true,
            center: [0, 0],
            zoom: defaultMapZoom,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

        mapInstanceRef.current = map;

        return () => {
            // Clean up on unmount
            mapInstanceRef.current?.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    return (
        <div
            ref={mapContainerRef}
            className={styles.mapContainer}
        />
    );
}
