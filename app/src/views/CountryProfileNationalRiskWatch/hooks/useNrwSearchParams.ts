import { useCallback } from 'react';
import {
    useNavigate,
    useParams,
    useSearchParams,
} from 'react-router-dom';
import { isDefined } from '@togglecorp/fujs';

import { nrwStandalone } from '#config';
import useCountry from '#hooks/domain/useCountry';
import useUrlSearchState from '#hooks/useUrlSearchState';
import supportedLayerNames from '#utils/nrw/layers';

import {
    type CountryCodeIso3,
    type Latitude,
    type Longitude,
    type MapViewChangeHandler,
    type NrwEvent,
    type NrwEventHazardType,
    type NrwEventSelectHandler,
    type NrwLayerName,
    type PlaceCode,
    type PlaceCodeChangeHandler,
    type UrlParameter,
    type Zoom,
} from '../types';
import {
    parseCountryCode,
    parsePlaceCode,
} from '../utils';

function sanitizeFloatInRange(
    value: UrlParameter,
    min: number,
    max: number,
) {
    const trimmed = value?.trim() ?? '';
    if (trimmed === '') {
        return null;
    }

    const casted = Number(trimmed);
    if (!Number.isFinite(casted) || casted < min || casted > max) {
        return null;
    }

    // We now have a valid value.
    return casted;
}

// We can now confidently assert that it's either null or a specific opaque
// type.
function parseZoomUrlParameter(value: UrlParameter) {
    return sanitizeFloatInRange(value, 0, 24) as Zoom | null;
}

function parseMapLatitudeParameter(value: UrlParameter) {
    return sanitizeFloatInRange(value, -90, 90) as Latitude | null;
}

function parseMapLongitudeParameter(value: UrlParameter) {
    return sanitizeFloatInRange(value, -180, 180) as Longitude | null;
}

function parseEventIdUrlParameter(value: UrlParameter) {
    const casted = Number(value);

    return Number.isInteger(casted) && casted > 0
        ? casted as NrwEvent['eventId']
        : undefined;
}

const serializeEventIdUrlParameter = (eventId: NrwEvent['eventId'] | undefined) => eventId;

function parsePlaceCodeUrlParameter(value: UrlParameter): PlaceCode | undefined {
    return parsePlaceCode(value) ?? undefined;
}

// Parse comma-separated ISO_A3 country codes from a URL search parameter.
// Returns an empty array if there are no valid codes.
function parseCountriesUrlParameter(value: UrlParameter) {
    if (!value || value.trim() === '') {
        return [];
    }

    return value
        .split(',')
        .map(parseCountryCode)
        .filter(isDefined);
}

// Raw country code tokens from the URL, normalized for comparison.
// Includes codes that failed ISO_A3 validation, so callers can detect
// unsupported values instead of silently dropping them.
function parseRawCountriesUrlParameter(value: UrlParameter): string[] {
    if (!value || value.trim() === '') {
        return [];
    }

    return value
        .split(',')
        .map((token) => token.trim().toUpperCase())
        .filter((token) => token !== '');
}

// Convert ISO_A3 country codes to a comma-separated string for the search params.
// Returns undefined when there are no codes so that the search param is removed.
function serializeCountriesUrlParameter(countryCodes: CountryCodeIso3[]) {
    if (countryCodes.length === 0) {
        return undefined;
    }

    return countryCodes.join(',');
}

// TODO: consider moving default visibility to a layer property in the NRW data model.
function getDefaultVisibleLayers(hazardType?: NrwEventHazardType): NrwLayerName[] {
    const defaultVisibleLayers: NrwLayerName[] = [supportedLayerNames.exposedPopulation];

    if (hazardType === 'floods') {
        defaultVisibleLayers.push(supportedLayerNames.floodDepth);
    }

    return defaultVisibleLayers;
}

// Only accept layer names that are supported by the frontend.
function parseLayersUrlParameter(value: UrlParameter): NrwLayerName[] {
    if (!value || value.trim() === '') {
        return [];
    }

    const requestedNames = value.split(',').map((name) => name.trim());

    return Object.values(supportedLayerNames)
        .filter((name) => requestedNames.includes(name));
}

function serializeLayersUrlParameter(layerNames: NrwLayerName[] | undefined) {
    if (!layerNames || layerNames.length === 0) {
        return undefined;
    }

    return layerNames.join(',');
}

const roundZoomForUrl = (zoom: Zoom) => zoom.toFixed(2).toString();

const roundLatitudeOrLongitudeForUrl = (value: Latitude | Longitude) => value.toFixed(6).toString();

function useNrwSearchParams() {
    const navigate = useNavigate();
    // Unlikely that these URL params will have invalid values, but let's be defensive.
    const [zoomFromUrlParams] = useUrlSearchState('z', parseZoomUrlParameter, () => '');
    const [latitudeFromUrlParams] = useUrlSearchState('lat', parseMapLatitudeParameter, () => '');
    const [longitudeFromUrlParams] = useUrlSearchState('lon', parseMapLongitudeParameter, () => '');
    const [countriesFromUrlParams] = useUrlSearchState(
        'countries',
        parseCountriesUrlParameter,
        serializeCountriesUrlParameter,
    );
    const [searchParams] = useSearchParams();
    const rawCountriesFromUrlParams = parseRawCountriesUrlParameter(searchParams.get('countries'));
    const [selectedEventId] = useUrlSearchState(
        'event',
        parseEventIdUrlParameter,
        serializeEventIdUrlParameter,
    );
    const [layersFromUrlParams, setLayersFromUrlParams] = useUrlSearchState(
        'layers',
        parseLayersUrlParameter,
        serializeLayersUrlParameter,
    );
    const [placeCodeFromUrlParams] = useUrlSearchState(
        'placeCode',
        parsePlaceCodeUrlParameter,
        () => '',
    );

    // For embedded, get the country from the route.
    // These are hooks, so they can't be placed in a conditional block.
    // For standalone, this will return undefined, which is fine.
    const { countryId } = useParams<{ countryId: string }>();
    const countryFromRouting = useCountry({ id: Number(countryId) });
    const countryCodeFromRouting = parseCountryCode(countryFromRouting?.iso3);
    const countriesFromRouting = isDefined(countryCodeFromRouting)
        ? [countryCodeFromRouting]
        : undefined;

    // The country codes specified in the URL.
    // Handle both standalone and embedded modes (from search params or from routing).
    // Countries are set once at load and never change.
    const urlCountries = nrwStandalone
        ? countriesFromUrlParams
        : countriesFromRouting;

    // Update several params in one navigation, starting from the live URL.
    const setSearchParams = useCallback(
        (update: (params: URLSearchParams) => void) => {
            const params = new URLSearchParams(window.location.search);
            update(params);
            navigate(`?${params}`, { replace: true });
        },
        [navigate],
    );

    const handleMapViewChange: MapViewChangeHandler = useCallback(
        (newZoom, newLatitude, newLongitude) => {
            setSearchParams((params) => {
                params.set('z', roundZoomForUrl(newZoom));
                params.set('lat', roundLatitudeOrLongitudeForUrl(newLatitude));
                params.set('lon', roundLatitudeOrLongitudeForUrl(newLongitude));
            });
        },
        [setSearchParams],
    );

    const handleSelectedEventIdChange: NrwEventSelectHandler = useCallback(
        (eventId, hazardType) => {
            if (eventId === selectedEventId) {
                return;
            }

            setSearchParams((params) => {
                if (isDefined(eventId)) {
                    params.set('event', String(eventId));
                    params.set('layers', getDefaultVisibleLayers(hazardType).join(','));
                } else {
                    params.delete('event');
                    params.delete('layers');
                }
                params.delete('z');
                params.delete('lat');
                params.delete('lon');
                params.delete('placeCode');
            });
        },
        [selectedEventId, setSearchParams],
    );

    // The drill starts again at the top when the admin area is cleared.
    const handleUrlPlaceCodeChange: PlaceCodeChangeHandler = useCallback(
        (placeCode) => {
            setSearchParams((params) => {
                if (isDefined(placeCode)) {
                    params.set('placeCode', placeCode);
                } else {
                    params.delete('placeCode');
                }
            });
        },
        [setSearchParams],
    );

    return {
        zoomFromUrlParams,
        latitudeFromUrlParams,
        longitudeFromUrlParams,
        urlCountries,
        rawCountriesFromUrlParams,
        handleMapViewChange,
        selectedEventId,
        handleSelectedEventIdChange,
        layersFromUrlParams,
        setLayersFromUrlParams,
        placeCodeFromUrlParams,
        handleUrlPlaceCodeChange,
    };
}

export default useNrwSearchParams;
