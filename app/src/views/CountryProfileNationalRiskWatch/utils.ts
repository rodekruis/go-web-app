import { getGeoJsonBounds } from '#utils/geo';
import { type NrwApiResponse } from '#utils/restRequest';

import NrwLngLat from './NrwLngLat';
import {
    type AdminLevel,
    type CountryCodeIso3,
    type Latitude,
    type Longitude,
    type LongitudeLatitudeBounds,
    type MapView,
    type Zoom,
} from './types';

export function getMapView(
    latitude: Latitude | null,
    longitude: Longitude | null,
    zoom: Zoom,
): MapView | undefined {
    if (latitude === null || longitude === null) {
        return undefined;
    }

    return {
        center: new NrwLngLat(longitude, latitude),
        zoom,
    };
}

// Build the pg_featureserv-style filter for the given admin levels
// of the given countries. Country codes are already validated
// as ISO_A3, so it's safe to interpolate them into the filter string.
function getCountryAdminLevelFilter(countryCodes: CountryCodeIso3[], adminLevels: AdminLevel[]) {
    const countryFilter = countryCodes
        .map((countryCode) => `countryCodeIso3='${countryCode}'`)
        .join(' OR ');

    const adminLevelFilter = adminLevels
        .map((adminLevel) => `adminLevel=${adminLevel}`)
        .join(' OR ');

    return `(${countryFilter}) AND (${adminLevelFilter})`;
}

// Build the query to fetch country admin areas.
// The pg_featureserv query parameters are not part
// of the generated schema, so the query is untyped there.
export function getAdminAreasQuery(countryCodes: CountryCodeIso3[], adminLevels: AdminLevel[]) {
    return {
        filter: getCountryAdminLevelFilter(countryCodes, adminLevels),
        limit: 10000,
        // Simplify with a factor of 0.05, which gives a 90% size reduction in tests
        transform: 'simplify,0.05',
    };
}

// Compute the combined lon/lat bounds of an admin-areas feature collection.
// Returns undefined when the collection has no usable geometries.
export function getFeatureCollectionBounds(
    featureCollection: NrwApiResponse<'/admin-areas'>,
) {
    const [west, south, east, north] = getGeoJsonBounds(featureCollection);

    if (![west, south, east, north].every(Number.isFinite)) {
        return undefined;
    }

    return [
        new NrwLngLat(
            west as Longitude,
            south as Latitude,
        ),
        new NrwLngLat(
            east as Longitude,
            north as Latitude,
        ),
    ] as LongitudeLatitudeBounds;
}
