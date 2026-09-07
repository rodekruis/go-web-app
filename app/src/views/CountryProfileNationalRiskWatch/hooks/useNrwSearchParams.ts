import {
    useParams,
    useSearchParams,
} from 'react-router-dom';
import { isDefined } from '@togglecorp/fujs';

import { nrwStandalone } from '#config';
import useCountry from '#hooks/domain/useCountry';
import useUrlSearchState from '#hooks/useUrlSearchState';

import {
    type CountryCodeIso3,
    type Latitude,
    type Longitude,
    type MapViewChangeHandler,
    type UrlParameter,
    type Zoom,
} from '../types';
import { parseCountryCode } from '../utils';

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

// Convert ISO_A3 country codes to a comma-separated string for the search params.
// Returns undefined when there are no codes so that the search param is removed.
function serializeCountriesUrlParameter(countryCodes: CountryCodeIso3[]) {
    if (countryCodes.length === 0) {
        return undefined;
    }

    return countryCodes.join(',');
}

const roundZoomForUrl = (zoom: Zoom) => zoom.toFixed(2).toString();

const roundLatitudeOrLongitudeForUrl = (value: Latitude | Longitude) => value.toFixed(6).toString();

function useNrwSearchParams() {
    // useUrlSearchState is limited: its setValue hook cannot handle setting
    // multiple params in quick succession. Workaround: use setSearchParams for
    // handling map view changes.
    const [, setSearchParams] = useSearchParams();
    // Unlikely that these URL params will have invalid values, but let's be defensive.
    const [zoomFromUrlParams] = useUrlSearchState('z', parseZoomUrlParameter, () => '');
    const [latitudeFromUrlParams] = useUrlSearchState('lat', parseMapLatitudeParameter, () => '');
    const [longitudeFromUrlParams] = useUrlSearchState('lon', parseMapLongitudeParameter, () => '');
    const [countriesFromUrlParams] = useUrlSearchState(
        'countries',
        parseCountriesUrlParameter,
        serializeCountriesUrlParameter,
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

    const handleMapViewChange: MapViewChangeHandler = (
        newZoom,
        newLatitude,
        newLongitude,
    ) => {
        setSearchParams(
            (prevParams) => {
                prevParams.set('z', roundZoomForUrl(newZoom));
                prevParams.set('lat', roundLatitudeOrLongitudeForUrl(newLatitude));
                prevParams.set('lon', roundLatitudeOrLongitudeForUrl(newLongitude));
                return prevParams;
            },
            { replace: true },
        );
    };

    return {
        zoomFromUrlParams,
        latitudeFromUrlParams,
        longitudeFromUrlParams,
        urlCountries,
        handleMapViewChange,
    };
}

export default useNrwSearchParams;
