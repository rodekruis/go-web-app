// We add an "opaque type" to a value to communicate that it has been validated.
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

export type CountryCode = string & {
  [validCountryCode]: true
}

// eslint-disable-next-line max-len
export type MapViewChangeHandler = (newZoom: Zoom, newLatitude: Latitude, newLongitude: Longitude) => void;
