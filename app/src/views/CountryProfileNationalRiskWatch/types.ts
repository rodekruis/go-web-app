// We add an "opaque type" to a value to communicate that it has been validated.

import type NrwLngLat from './NrwLngLat';

// https://evertpot.com/opaque-ts-types/
export type UrlParameter = string | null | undefined;

declare const validZoom: unique symbol;

export type Zoom = number & {
  [validZoom]: true
}

declare const validLatitude: unique symbol;

export type Latitude = number & {
  [validLatitude]: true
}

declare const validLongitude: unique symbol;

export type Longitude = number & {
  [validLongitude]: true
}

declare const validCountryCode: unique symbol;

export type CountryCodeIso3 = string & {
  [validCountryCode]: true
}

// eslint-disable-next-line max-len
export type MapViewChangeHandler = (newZoom: Zoom, newLatitude: Latitude, newLongitude: Longitude) => void;

// Lon/lat bounds as [southwest, northeast] corners.
export type LngLatBounds = [NrwLngLat, NrwLngLat];

// The resolved starting view handed to the map component.
export type InitialMapView = {
    zoom: Zoom;
    center: NrwLngLat;
    fitBounds?: LngLatBounds;
};
