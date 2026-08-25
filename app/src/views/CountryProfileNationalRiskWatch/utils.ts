import { getGeoJsonBounds } from '#utils/geo';
import { type NrwApiResponse } from '#utils/restRequest';

import NrwLngLat from './NrwLngLat';
import {
    type CountryCodeIso3,
    type Latitude,
    type Longitude,
    type LongitudeLatitudeBounds,
} from './types';

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

// Compute the combined lon/lat bounds of an admin-areas feature collection.
// Returns null when the collection has no usable geometries.
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
