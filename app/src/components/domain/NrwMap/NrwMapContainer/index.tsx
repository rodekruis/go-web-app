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

function NrwMapContainer(props: {
    initialMapView: InitialMapView;
    onMapViewChange: MapViewChangeHandler;
}) {
    const {
        initialMapView,
        onMapViewChange,
    } = props;

    const {
        zoom,
        center,
        fitBounds,
    } = initialMapView;

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
                styles.nrwMapContainer,
                nrwStandalone && styles.nrwStandalone,
            )}
        />
    );
}

export default NrwMapContainer;
