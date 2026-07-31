import 'mapbox-gl-v3/dist/mapbox-gl.css';

import {
    useEffect,
    useRef,
} from 'react';
import { _cs } from '@togglecorp/fujs';
import mapboxgl, { type Map as MapboxGLMap } from 'mapbox-gl-v3';

import {
    mbtoken,
    nrwStandalone,
} from '#config';
import fetchJson from '#utils/nrw/nrwDataFetchHelpers';
import type { MapViewParameters } from '#utils/nrw/nrwMapTypes';
import {
    getBoundsFromFeatures,
    getMapViewFromParameters,
    getMapViewParametersFromMap,
    getZoomToFitBounds,
} from '#utils/nrw/nrwMapViewHelpers';
import getAdminAreaUrl from '#utils/nrw/nrwUrls';

import styles from './styles.module.css';

// Get this from Mapbox Studio > Styles > Style url
const nrwMapboxStyleUrl = 'mapbox://styles/510global/cmrls7huy001501sde6mdhzlk';

// Time in ms for map panning and zooming animations
const animationDurationMs = 500;

// Admin level of country borders, used to scope the zoom-to-fit bounds.
const countryAdminLevel = 0;

interface NrwMapProps {
    // ISO_A3 code list of countries that the map is scoped to.
    scopedCountries: string[];

    // Initial map view from URL search params, if available.
    initialMapView?: MapViewParameters | null;

    // Callback for when the map center/zoom change finishes.
    // This is hit frequently through map interaction, so avoid costly work here.
    onViewChange?: (mapView: MapViewParameters) => void;
}

// Fetch the admin0 country geometry for the scoped countries
// to compute the bounds for zooming to fit the map view.
async function fetchScopedCountriesBoundsFeatures(
    scopedCountries: string[],
): Promise<GeoJSON.Feature[]> {
    const admin0Results = await Promise.allSettled(
        scopedCountries.map((countryCodeIso3) => fetchJson<GeoJSON.FeatureCollection>(
            getAdminAreaUrl(countryCodeIso3, countryAdminLevel),
            `admin0 for ${countryCodeIso3}`,
        )),
    );

    return admin0Results.flatMap((result) => (
        result.status === 'fulfilled'
            ? (result.value.features ?? [])
            : []
    ));
}

export default function NrwMap(props: NrwMapProps) {
    const {
        scopedCountries,
        initialMapView,
        onViewChange,
    } = props;

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<MapboxGLMap | null>(null);
    const onViewChangeRef = useRef(onViewChange);

    useEffect(() => {
        onViewChangeRef.current = onViewChange;
    }, [onViewChange]);

    // Initialize the Mapbox map instance
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) {
            return undefined;
        }

        mapboxgl.accessToken = mbtoken;

        const { center, zoom } = getMapViewFromParameters(initialMapView);

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: nrwMapboxStyleUrl,
            projection: 'mercator',
            attributionControl: true,
            center,
            zoom,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

        // Update the map view state after each pan/zoom end.
        map.on('moveend', () => {
            const mapView = getMapViewParametersFromMap(map);
            if (!mapView) {
                return;
            }
            onViewChangeRef.current?.(mapView);
        });

        mapInstanceRef.current = map;

        return () => {
            // Clean up on unmount
            mapInstanceRef.current?.remove();
            mapInstanceRef.current = null;
        };
    // Set the dependencies to empty since this only runs on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fit the map to the scoped countries whenever they change (e.g. once the
    // country is resolved from the route in embedded mode). A valid deep-linked
    // initial view takes precedence, so we skip fitting in that case.
    useEffect(() => {
        const hasValidInitialView = initialMapView
            && Number.isFinite(initialMapView.center.lon)
            && Number.isFinite(initialMapView.center.lat);
        if (hasValidInitialView || scopedCountries.length === 0) {
            return undefined;
        }

        let cancelled = false;

        const fitToScopedCountries = () => {
            fetchScopedCountriesBoundsFeatures(scopedCountries)
                .then((features) => {
                    const bounds = getBoundsFromFeatures(features);
                    if (cancelled || !bounds || !mapInstanceRef.current) {
                        return;
                    }
                    mapInstanceRef.current.fitBounds(getZoomToFitBounds(bounds), {
                        duration: animationDurationMs,
                    });
                })
                .catch((error) => {
                    // Failed to load country bounds.
                    // TODO: Task 43479
                    // Check with design for how to make this user facing.
                    // eslint-disable-next-line no-console
                    console.error('[NrwMap] Failed to fit to scoped countries:', error);
                });
        };

        const map = mapInstanceRef.current;
        if (map?.loaded()) {
            fitToScopedCountries();
        } else {
            map?.once('load', fitToScopedCountries);
        }

        return () => {
            cancelled = true;
        };
    }, [scopedCountries, initialMapView]);

    return (
        <div
            ref={mapContainerRef}
            className={_cs(
                styles.nrwMap,
                nrwStandalone && styles.nrwStandalone,
            )}
        />
    );
}
