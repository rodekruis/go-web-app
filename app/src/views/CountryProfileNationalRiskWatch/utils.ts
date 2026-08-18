import { nrwApi } from '#config';
import { getGeoJsonBounds } from '#utils/geo';
import { resolveUrl } from '#utils/resolveUrl';

import NrwLngLat from './NrwLngLat';
import {
    type CountryCodeIso3,
    type Latitude,
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

// -------- Initial map view resolution --------
// The map is initialized exactly once, so the view (center + zoom) it starts at
// must be resolved before the map component mounts. This module owns that logic:
// deep-linked URL params take precedence, otherwise we fit the scoped countries.

// Default map view
export const DEFAULT_MAP_ZOOM = 3 as Zoom;
export const DEFAULT_LATITUDE = 0 as Latitude;
export const DEFAULT_LONGITUDE = 0 as Longitude;

// The resolved starting view handed to the map component.
export type InitialMapView = {
    zoom: Zoom;
    center: NrwLngLat;
};

// Lon/lat bounds as [[west, south], [east, north]].
type LonLatBounds = [[number, number], [number, number]];

// Padding added around the scoped countries so they don't touch the map edges.
const ZOOM_TO_FIT_PADDING_RATIO = 0.1;
// Mapbox uses 512px tiles; the whole world spans 512 * 2^zoom pixels.
const MAPBOX_TILE_SIZE_PX = 512;
// The map viewport isn't known before the map mounts, so assume a nominal size
// to derive a zoom that fits the scoped countries. Panning/zooming is unaffected.
const ASSUMED_MAP_VIEWPORT_PX = 1000;
const MAX_MAP_ZOOM = 22 as Zoom;

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
function getAdminArea0Url(countryCode: CountryCode) {
    const filter = `countryCodeIso3=%27${countryCode}%27%20AND%20adminLevel=0`;
    return `${resolveUrl(nrwApi, 'admin-areas')}?filter=${filter}&limit=10000&transform=simplify,0.05`;
}

// Build a square lon/lat bounding box centered on the data, sized to the larger
// of the width/height dimensions, plus padding on all sides.
function getPaddedSquareBounds(bounds: LonLatBounds, paddingRatio: number): LonLatBounds {
    const [[minLongitude, minLatitude], [maxLongitude, maxLatitude]] = bounds;

    const centerLongitude = (minLongitude + maxLongitude) / 2;
    const centerLatitude = (minLatitude + maxLatitude) / 2;

    const largerDimension = Math.max(
        maxLongitude - minLongitude,
        maxLatitude - minLatitude,
    );
    const halfSide = (largerDimension * (1 + paddingRatio)) / 2;

    return [
        [centerLongitude - halfSide, centerLatitude - halfSide],
        [centerLongitude + halfSide, centerLatitude + halfSide],
    ];
}

// Web Mercator latitude in radians, clamped to the projection's valid range.
function latitudeToMercatorRadians(latitude: number) {
    const sin = Math.sin((latitude * Math.PI) / 180);
    const radius = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radius, Math.PI), -Math.PI) / 2;
}

// Derive the zoom level that fits the given bounds into the assumed viewport.
function getZoomFromBounds(bounds: LonLatBounds): Zoom {
    const [[west, south], [east, north]] = bounds;

    const latitudeFraction = (
        latitudeToMercatorRadians(north) - latitudeToMercatorRadians(south)
    ) / Math.PI;
    const longitudeDiff = east - west;
    const longitudeFraction = (longitudeDiff < 0 ? longitudeDiff + 360 : longitudeDiff) / 360;

    const zoomForFraction = (fraction: number) => (
        Math.log2(ASSUMED_MAP_VIEWPORT_PX / MAPBOX_TILE_SIZE_PX / fraction)
    );

    const zoom = Math.min(
        zoomForFraction(latitudeFraction),
        zoomForFraction(longitudeFraction),
        MAX_MAP_ZOOM,
    );

    // Guard against zero/negative fractions producing non-finite zooms.
    return (Number.isFinite(zoom) ? Math.max(zoom, 0) : DEFAULT_MAP_ZOOM) as Zoom;
}

// Convert lon/lat bounds into a map view (center + zoom) that fits them.
function getMapViewFromBounds(bounds: LonLatBounds): InitialMapView {
    const paddedBounds = getPaddedSquareBounds(bounds, ZOOM_TO_FIT_PADDING_RATIO);
    const [[west, south], [east, north]] = paddedBounds;

    return {
        center: new NrwLngLat(
            ((west + east) / 2) as Longitude,
            ((south + north) / 2) as Latitude,
        ),
        zoom: getZoomFromBounds(paddedBounds),
    };
}

// Fetch the admin0 outlines for the scoped countries and compute their combined
// lon/lat bounds. Returns null when nothing could be fetched or bounded.
async function fetchScopedCountriesBounds(
    countryCodes: CountryCode[],
    signal?: AbortSignal,
): Promise<LonLatBounds | null> {
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

    return [
        [west, south],
        [east, north],
    ];
}

// Compute a map view (center + zoom) that fits the scoped countries' bounds.
// Returns null when there are no countries or their outlines can't be fetched,
// leaving the caller to keep whatever view it already has.
export async function fitCountriesMapView(
    countries: CountryCode[],
    signal?: AbortSignal,
): Promise<InitialMapView | null> {
    if (countries.length === 0) {
        return null;
    }

    const bounds = await fetchScopedCountriesBounds(countries, signal);
    if (!bounds) {
        return null;
    }

    return getMapViewFromBounds(bounds);
}
