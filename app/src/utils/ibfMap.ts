// TODO: Find a better differentiation between ibfMap.ts and ibfMapHelpers.ts and simplify
// Task: https://dev.azure.com/redcrossnl/IBF/_workitems/edit/41662

import { maptilerApiKey } from '#config';

// Map property strings
export const noCountrySelectedValue = 'None';

// URL search parameter keys
export const countryParamsKey = 'c';
export const eventIdParamsKey = 'e';

// Data field keys, for instance keys in the GeoJSON data.
export const COUNTRY_FIELD_KEY = 'country';
export const PLACE_CODE_FIELD_KEY = 'code';

// Map URLs
const maptilerBaseUrl = 'https://api.maptiler.com';
// Simple, default IBF data map
export const mapUrlSimpleStyleJson = `${maptilerBaseUrl}/maps/019c41d2-17c7-7e5e-9a47-d3b3f9515a5b/style.json?key=${maptilerApiKey}`;
