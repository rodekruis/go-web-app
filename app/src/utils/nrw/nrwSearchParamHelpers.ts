/**
 * Helper functions related to URL search parameters used for the NRW map
 */

// URL search parameter keys
export const countryParamsKey = 'c';
export const mapZoomParamsKey = 'z';
export const mapCenterLatParamsKey = 'lat';
export const mapCenterLonParamsKey = 'lon';

// Convert to uppercase and accept only 3 letter length codes
// Returns null if the value is not a valid ISO_A3 code
function sanitizeCountryCode(value: string | null | undefined): string | null {
    const countryRegex = /^[A-Z]{3}$/;
    const cleanedValue = value?.trim().toUpperCase() ?? '';
    return countryRegex.test(cleanedValue) ? cleanedValue : null;
}

// Parse comma-separated country codes from URL param
// Returns empty array if value is null/undefined/empty or has no valid ISO_A3 codes
export function parseAndSanitizeCountryCodesParam(value: string | null | undefined): string[] {
    if (!value || value.trim() === '') {
        return [];
    }

    return value
        .split(',')
        .map((countryCode) => sanitizeCountryCode(countryCode))
        .filter((countryCode): countryCode is string => countryCode !== null);
}

// Serialize country codes array to comma-separated string for URL param
// Returns empty string if array is empty or all values are invalid
export function serializeCountryCodesParam(countryCodes: string[]): string {
    return countryCodes
        .map((countryCode) => sanitizeCountryCode(countryCode))
        .filter((countryCode): countryCode is string => countryCode !== null)
        .join(',');
}

function sanitizeFloatInRange(
    value: string | null | undefined,
    min: number,
    max: number,
): number | null {
    const cleanedValue = value?.trim() ?? '';
    if (cleanedValue === '') {
        return null;
    }

    const parsedValue = Number(cleanedValue);
    if (!Number.isFinite(parsedValue)) {
        return null;
    }

    if (parsedValue < min || parsedValue > max) {
        return null;
    }

    return parsedValue;
}

export function sanitizeMapZoomParam(value: string | null | undefined): number | null {
    return sanitizeFloatInRange(value, 0, 24);
}

export function sanitizeMapLatitudeParam(value: string | null | undefined): number | null {
    return sanitizeFloatInRange(value, -90, 90);
}

export function sanitizeMapLongitudeParam(value: string | null | undefined): number | null {
    return sanitizeFloatInRange(value, -180, 180);
}
