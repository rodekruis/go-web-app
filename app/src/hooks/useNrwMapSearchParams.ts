import {
    useCallback,
    useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';

import { defaultMapZoom } from '#utils/nrw/nrwConstants';
import type { MapViewParameters } from '#utils/nrw/nrwMapTypes';
import {
    countryParamsKey,
    mapCenterLatParamsKey,
    mapCenterLonParamsKey,
    mapZoomParamsKey,
    parseAndSanitizeCountryCodesParam,
    sanitizeMapLatitudeParam,
    sanitizeMapLongitudeParam,
    sanitizeMapZoomParam,
    serializeCountryCodesParam,
} from '#utils/nrw/nrwSearchParamHelpers';

interface InitialParams {
    scopedCountries: string[];
    initialMapView: MapViewParameters | null;
}

interface MapViewParams {
    countries: string[];
    mapView?: MapViewParameters;
}

/**
 * Hook for NRW map deep-linking search parameter handling.
 * The parameters are read once on mount and then overwritten as
 * the relevant view states change.
 */
export default function useNrwMapSearchParams() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Read initial param values once on mount.
    const [initialParams] = useState<InitialParams>(() => {
        const selectedMapZoom = sanitizeMapZoomParam(searchParams.get(mapZoomParamsKey));
        const selectedMapLat = sanitizeMapLatitudeParam(searchParams.get(mapCenterLatParamsKey));
        const selectedMapLon = sanitizeMapLongitudeParam(searchParams.get(mapCenterLonParamsKey));

        // Initial map view based on the params
        const initialMapView = selectedMapLat !== null && selectedMapLon !== null
            ? {
                zoom: selectedMapZoom ?? defaultMapZoom,
                center: {
                    lat: selectedMapLat,
                    lon: selectedMapLon,
                },
            }
            : null;

        return {
            scopedCountries: parseAndSanitizeCountryCodesParam(searchParams.get(countryParamsKey)),
            initialMapView,
        };
    });

    // Set params reflecting the current map view, keeping the URL shareable.
    const setMapViewParams = useCallback(({ countries, mapView }: MapViewParams) => {
        const serializedCountries = serializeCountryCodesParam(countries);
        const nextParams: Record<string, string> = {
            [countryParamsKey]: serializedCountries,
        };

        if (mapView) {
            nextParams[mapZoomParamsKey] = mapView.zoom.toFixed(2);
            nextParams[mapCenterLonParamsKey] = mapView.center.lon.toFixed(6);
            nextParams[mapCenterLatParamsKey] = mapView.center.lat.toFixed(6);
        }

        // Replace existing entry to not fill up the back button stack.
        setSearchParams(nextParams, { replace: true });
    }, [setSearchParams]);

    return {
        initialParams,
        setMapViewParams,
    };
}
