import {
    type Latitude,
    type Longitude,
    type urlParameter,
    type Zoom,
} from './types';

function sanitizeFloatInRange(
    value: urlParameter,
    min: number,
    max: number,
) {
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

// Type guards.
function isValidZoom(input: number | null): input is Zoom {
    return input !== null;
}

function isValidLatitude(input: number | null): input is Latitude {
    return input !== null;
}

function isValidLongitude(input: number | null): input is Longitude {
    return input !== null;
}

export function sanitizeZoomUrlParam(value: urlParameter) {
    const parsed = sanitizeFloatInRange(value, 0, 24);
    return isValidZoom(parsed) ? parsed as Zoom : null;
}

export function sanitizeMapLatitudeParam(value: urlParameter) {
    const parsed = sanitizeFloatInRange(value, -90, 90);
    return isValidLatitude(parsed) ? parsed as Latitude : null;
}

export function sanitizeMapLongitudeParam(value: urlParameter) {
    const parsed = sanitizeFloatInRange(value, -180, 180);
    return isValidLongitude(parsed) ? parsed as Longitude : null;
}

// Because of how useUrlSearchState is typed we need to accept null here as well.
export function serializeNumberToUrlParam(value: Zoom | Latitude | Longitude | null) {
    return value === null ? '' : value.toString();
}

export class NrwMapCenter {
    lat: Latitude;

    lon: Longitude;

    constructor({ lat, lon }: { lat: Latitude; lon: Longitude; }) {
        this.lat = lat;
        this.lon = lon;
    }

    getForMapbox() {
        return {
            lat: this.lat,
            lon: this.lon,
        };
    }
}
