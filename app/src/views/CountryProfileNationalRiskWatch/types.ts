// We add an "opaque type" to a value to communicate that it has been validated.

import { type NrwApiResponse } from '#utils/restRequest';

import type NrwLngLat from './NrwLngLat';

// https://evertpot.com/opaque-ts-types/
export type UrlParameter = string | null | undefined;

declare const validZoom: unique symbol;

export type Zoom = number & {
    [validZoom]: true;
};

declare const validLatitude: unique symbol;

export type Latitude = number & {
    [validLatitude]: true;
};

declare const validLongitude: unique symbol;

export type Longitude = number & {
    [validLongitude]: true;
};

declare const validCountryCode: unique symbol;

export type CountryCodeIso3 = string & {
    [validCountryCode]: true;
};

declare const validAdminLevel: unique symbol;

export type AdminLevel = number & {
    [validAdminLevel]: true;
};

// eslint-disable-next-line max-len
export type MapViewChangeHandler = (newZoom: Zoom, newLatitude: Latitude, newLongitude: Longitude) => void;

// Lon/lat bounds as two bounding box corners, i.e. the southwest and northeast corners.
// The order doesn't matter for Mapbox.
export type LongitudeLatitudeBounds = [NrwLngLat, NrwLngLat];

export type MapView = {
    zoom: Zoom;
    center: NrwLngLat;
    fitBounds?: LongitudeLatitudeBounds;
};

export type NrwEvent = NrwApiResponse<'/events'>[number];

export type NrwLayer = NrwApiResponse<'/layers'>[number];
export type NrwHazardType = NrwLayer['hazardType'];
