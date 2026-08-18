import { nrwApi } from '#config';
import { getGeoJsonBounds } from '#utils/geo';
import { resolveUrl } from '#utils/resolveUrl';

import NrwLngLat from './NrwLngLat';
import {
    type CountryCodeIso3,
    type Latitude,
    type Longitude,
    type LonLatBounds,
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
        .filter((countryCode): countryCode is CountryCodeIso3 => countryCode !== null);
}

// Convert ISO_A3 country codes to a comma-separated string for the search params.
// Returns undefined when there are no codes so that the search param is removed.
export function serializeCountriesUrlParameter(countryCodes: CountryCodeIso3[]) {
    if (countryCodes.length === 0) {
        return undefined;
    }

    return countryCodes.join(',');
}

// Fetch a URL and parse the response body as JSON. Throws when the request fails.
async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, { signal });
    if (!response.ok) {
        throw new Error(
            `Failed to fetch ${url}: HTTP ${response.status} ${response.statusText}`,
        );
    }
    return response.json() as Promise<T>;
}

// Build the NRW API URL for a country's admin level 0 (country outline) GeoJSON.
// The country code is already validated to be ISO_A3, so it's safe to interpolate.
function getAdminArea0Url(countryCode: CountryCodeIso3) {
    const filter = `countryCodeIso3=%27${countryCode}%27%20AND%20adminLevel=0`;
    return `${resolveUrl(nrwApi, 'admin-areas')}?filter=${filter}&limit=10000&transform=simplify,0.05`;
}

// Fetch the admin0 outlines for the scoped countries and compute their combined
// lon/lat bounds. Returns null when there are no countries or their outlines
// can't be fetched, leaving the caller to fall back to the default view.
export async function fetchCountriesBounds(
    countryCodes: CountryCodeIso3[],
    signal?: AbortSignal,
): Promise<LonLatBounds | null> {
    if (countryCodes.length === 0) {
        return null;
    }

    const results = await Promise.allSettled(
        countryCodes.map(
            (countryCode) => fetchJson<GeoJSON.FeatureCollection>(
                getAdminArea0Url(countryCode),
                signal,
            ),
        ),
    );

    const features = results.flatMap((result) => (
        result.status === 'fulfilled' ? (result.value.features ?? []) : []
    ));

    if (features.length === 0) {
        return null;
    }

    const [west, south, east, north] = getGeoJsonBounds({
        type: 'FeatureCollection',
        features,
    });

    if (![west, south, east, north].every(Number.isFinite)) {
        return null;
    }

    // Clamp into valid lon/lat ranges so we can assert the opaque types.
    const clamp = (value: number, min: number, max: number) => Math.min(
        Math.max(value, min),
        max,
    );

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
