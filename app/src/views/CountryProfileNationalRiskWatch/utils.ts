import {
    isDefined,
    unique,
} from '@togglecorp/fujs';

import { getGeoJsonBounds } from '#utils/geo';

import NrwLngLat from './NrwLngLat';
import {
    type AdminAreaProperties,
    type AdminLevel,
    type CountryCodeIso3,
    type Latitude,
    type Longitude,
    type LongitudeLatitudeBounds,
    type MapView,
    type NrwAdminAreaAttributes,
    type NrwAdminAreaFeatureCollection,
    type NrwEvent,
    type PlaceCode,
    type Zoom,
} from './types';

// Sanitize to a valid country code in ISO_A3.
// Returns null if invalid.
export function parseCountryCode(value: string | undefined): CountryCodeIso3 | null {
    const countryRegex = /^[A-Z]{3}$/;
    const cleaned = value?.trim().toUpperCase() ?? '';
    return countryRegex.test(cleaned) ? (cleaned as CountryCodeIso3) : null;
}

// The countries that have events, deduplicated and sorted.
export function getEventCountries(events: NrwEvent[]): CountryCodeIso3[] {
    const countryCodes = events
        .map((event) => parseCountryCode(event.countryCodeIso3))
        .filter(isDefined);

    return unique(countryCodes, (countryCode) => countryCode).sort();
}

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

// Build the pg_featureserv-style filter for the given admin level
// of the given countries. Country codes are already validated
// as ISO_A3, so it's safe to interpolate them into the filter string.
function getCountryAdminLevelFilter(
    countryCodes: CountryCodeIso3[],
    adminLevel: AdminLevel,
    parentPlaceCode: PlaceCode | undefined,
) {
    const countryFilter = countryCodes
        .map((countryCode) => `countryCodeIso3='${countryCode}'`)
        .join(' OR ');

    const parentFilter = isDefined(parentPlaceCode)
        ? ` AND placeCodeLevel${adminLevel - 1}='${parentPlaceCode}'`
        : '';

    return `(${countryFilter}) AND adminLevel=${adminLevel}${parentFilter}`;
}

// Simplify less as the admin areas get smaller so the detail stays visible.
// Indexed by admin level.
const simplifyFactorByAdminLevel = [0.5, 0.01, 0.001, 0.0005];

// Build the query to fetch country admin areas.
export function getAdminAreasQuery(
    countryCodes: CountryCodeIso3[],
    adminLevel: AdminLevel,
    parentPlaceCode?: PlaceCode,
) {
    const simplifyFactor = simplifyFactorByAdminLevel[adminLevel]
        ?? simplifyFactorByAdminLevel[simplifyFactorByAdminLevel.length - 1];

    return {
        filter: getCountryAdminLevelFilter(countryCodes, adminLevel, parentPlaceCode),
        limit: 10000,
        transform: `simplify,${simplifyFactor}`,
    };
}

// Sanitize to a valid place code: an ISO_A2 country code followed by digits, e.g. SS0303.
// Returns null if invalid.
export function parsePlaceCode(value: unknown): PlaceCode | null {
    const placeCodeRegex = /^[A-Z]{2}\d*$/;
    return typeof value === 'string' && placeCodeRegex.test(value) ? (value as PlaceCode) : null;
}

// Mapbox stringifies nested GeoJSON properties in its rendered features,
// so the attributes may arrive as a JSON string.
function parseAdminAreaAttributes(attributes: unknown): NrwAdminAreaAttributes | undefined {
    if (typeof attributes === 'string') {
        try {
            return parseAdminAreaAttributes(JSON.parse(attributes));
        } catch {
            return undefined;
        }
    }

    return typeof attributes === 'object' && attributes !== null
        ? attributes as NrwAdminAreaAttributes
        : undefined;
}

// Read the admin area properties of a rendered /admin-areas feature.
// Mapbox returns these untyped, so they are validated here. Returns null if invalid.
export function parseAdminAreaProperties(properties: unknown): AdminAreaProperties | null {
    if (typeof properties !== 'object' || properties === null) {
        return null;
    }

    const {
        adminLevel, placeCode, nameEn, attributes,
    } = properties as Record<string, unknown>;
    const parsedPlaceCode = parsePlaceCode(placeCode);

    if (typeof adminLevel !== 'number' || parsedPlaceCode === null || typeof nameEn !== 'string') {
        return null;
    }

    const population = parseAdminAreaAttributes(attributes)?.POPULATION;

    return {
        adminLevel: adminLevel as AdminLevel,
        placeCode: parsedPlaceCode,
        name: nameEn,
        population: typeof population === 'number' ? population : undefined,
    };
}

// Compute the combined lon/lat bounds of an admin-areas feature collection.
// Returns undefined when the collection has no usable geometries.
export function getFeatureCollectionBounds(
    featureCollection: NrwAdminAreaFeatureCollection,
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
