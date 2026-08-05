// Add "opaque typing" to values so we can be sure they're valid after parsing.
// https://evertpot.com/opaque-ts-types/
export type urlParameter = string | null | undefined;

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
