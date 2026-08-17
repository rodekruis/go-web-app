import {
    type CountryCode,
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
export function sanitizeCountryCode(value: UrlParameter) {
    const countryRegex = /^[A-Z]{3}$/;
    const cleaned = value?.trim().toUpperCase() ?? '';
    return countryRegex.test(cleaned) ? (cleaned as CountryCode) : null;
}

// Parse comma-separated ISO_A3 country codes from a URL search parameter.
// Returns an empty array if there are no valid codes.
export function parseCountriesUrlParameter(value: UrlParameter) {
    if (!value || value.trim() === '') {
        return [];
    }

    return value
        .split(',')
        .map(sanitizeCountryCode)
        .filter((countryCode): countryCode is CountryCode => countryCode !== null);
}

// Convert ISO_A3 country codes to a comma-separated string for the search params.
export function serializeCountriesUrlParameter(countryCodes: CountryCode[]) {
    const serializedCodes = countryCodes
        .map(sanitizeCountryCode)
        .filter((countryCode): countryCode is CountryCode => countryCode !== null)
        .join(',');

    // If there are no valid codes, return undefined so that the search param is removed.
    return serializedCodes === '' ? undefined : serializedCodes;
}
