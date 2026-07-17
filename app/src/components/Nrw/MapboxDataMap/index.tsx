import 'mapbox-gl-v3/dist/mapbox-gl.css';

import {
    useCallback,
    useEffect,
    useRef,
} from 'react';
import { byPrefixAndName } from '@awesome.me/kit-92f09b5225/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import mapboxgl, { type Map as MapboxGLMap } from 'mapbox-gl-v3';

import { mbtoken } from '#config';
import {
    defaultMapZoom,
    NRW_MAPBOX_STYLE_URL,
} from '#utils/nrw/nrwConstants';

import styles from './styles.module.css';

/**
 * Mapbox v3 map component for NRW data maps.
 */
export default function MapboxDataMap() {
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

        mapInstanceRef.current = map;

        return () => {
            // Clean up on unmount
            mapInstanceRef.current?.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    const handleZoomIn = useCallback(() => {
        mapInstanceRef.current?.zoomIn();
    }, []);

    const handleZoomOut = useCallback(() => {
        mapInstanceRef.current?.zoomOut();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.mapWrapper}>
                <div
                    ref={mapContainerRef}
                    className={styles.map}
                />
                <div className={styles.zoomControls}>
                    <button
                        type="button"
                        className={styles.zoomButton}
                        onClick={handleZoomIn}
                        aria-label="Zoom in"
                    >
                        <FontAwesomeIcon icon={byPrefixAndName.fas!.plus!} />
                    </button>
                    <button
                        type="button"
                        className={styles.zoomButton}
                        onClick={handleZoomOut}
                        aria-label="Zoom out"
                    >
                        <FontAwesomeIcon icon={byPrefixAndName.fas!.minus!} />
                    </button>
                </div>
            </div>
        </div>
    );
}
