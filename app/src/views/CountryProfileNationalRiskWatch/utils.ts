import { isDefined } from '@togglecorp/fujs';

import { getGeoJsonBounds } from '#utils/geo';
import { type NrwApiResponse } from '#utils/restRequest';

import NrwLngLat from './NrwLngLat';
import {
    type CountryCodeIso3,
    type Latitude,
    type LngLatBounds,
    type Longitude,
    type UrlParameter,
    type Zoom,
} from './types';

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
export function parseZoomUrlParameter(value: UrlParameter) {
    return sanitizeFloatInRange(value, 0, 24) as Zoom | null;
}

export function parseMapLatitudeParameter(value: UrlParameter) {
    return sanitizeFloatInRange(value, -90, 90) as Latitude | null;
}

export function parseMapLongitudeParameter(value: UrlParameter) {
    return sanitizeFloatInRange(value, -180, 180) as Longitude | null;
}

// Sanitize to a valid country code in ISO_A3.
// Returns null if invalid.
export function parseCountryCode(value: string | undefined): CountryCodeIso3 | null {
    const countryRegex = /^[A-Z]{3}$/;
    const cleaned = value?.trim().toUpperCase() ?? '';
    return countryRegex.test(cleaned) ? (cleaned as CountryCodeIso3) : null;
}

// Parse comma-separated ISO_A3 country codes from a URL search parameter.
// Returns an empty array if there are no valid codes.
export function parseCountriesUrlParameter(value: UrlParameter) {
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
export function serializeCountriesUrlParameter(countryCodes: CountryCodeIso3[]) {
    if (countryCodes.length === 0) {
        return undefined;
    }

    return countryCodes.join(',');
}

// Build the pg_featureserv-style filter for admin level 0
// of the given countries. Country codes are already validated
// as ISO_A3, so it's safe to interpolate them into the filter string.
function getAdminArea0Filter(countryCodes: CountryCodeIso3[]) {
    const countryFilter = countryCodes
        .map((countryCode) => `countryCodeIso3='${countryCode}'`)
        .join(' OR ');

    if (countryCodes.length === 1) {
        return `${countryFilter} AND adminLevel=0`;
    }

    return `(${countryFilter}) AND adminLevel=0`;
}

// Build the query to fetch the admin0 outlines of the scoped countries.
// The pg_featureserv query parameters are not part
// of the generated schema, so the query is untyped there.
export function getAdminArea0Query(countryCodes: CountryCodeIso3[]) {
    return {
        filter: getAdminArea0Filter(countryCodes),
        limit: 10000,
        // Simplify with a factor of 0.05, which gives a 90% size reduction in tests
        transform: 'simplify,0.05',
    };
}

// Helper function to clamp values to acceptable ranges.
function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

// Compute the combined lon/lat bounds of an admin-areas feature collection.
// Returns null when the collection has no usable geometries.
export function getFeatureCollectionBounds(
    featureCollection: NrwApiResponse<'/admin-areas'> | undefined,
): LngLatBounds | null {
    if (!featureCollection || featureCollection.features.length === 0) {
        return null;
    }

    const [west, south, east, north] = getGeoJsonBounds(featureCollection);

    if (![west, south, east, north].every(Number.isFinite)) {
        return null;
    }

    // Return lon lat values, clamped to valid ranges, and asserted as the opaque types.
    return [
        new NrwLngLat(
            clamp(west, -180, 180) as Longitude,
            clamp(south, -90, 90) as Latitude,
        ),
        new NrwLngLat(
            clamp(east, -180, 180) as Longitude,
            clamp(north, -90, 90) as Latitude,
        ),
    ];
}
