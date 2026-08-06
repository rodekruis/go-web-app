/* eslint-disable max-classes-per-file -- disabling the rule for a wider scope is not necessary */

import { type Map as MapboxGLMap } from 'mapbox-gl-v3';

import {
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

// Type guards, these add an opaque type.
// Type guards *need* to return a boolean so we cannot have a single function
// that both returns the value and asserts the type.
function isValidZoom(input: number | null): input is Zoom {
    return input !== null;
}

function isValidLatitude(input: number | null): input is Latitude {
    return input !== null;
}

function isValidLongitude(input: number | null): input is Longitude {
    return input !== null;
}

export function sanitizeZoomUrlParam(value: UrlParameter) {
    const parsed = sanitizeFloatInRange(value, 0, 24);
    return isValidZoom(parsed) ? parsed as Zoom : null;
}

export function sanitizeMapLatitudeParam(value: UrlParameter) {
    const parsed = sanitizeFloatInRange(value, -90, 90);
    return isValidLatitude(parsed) ? parsed as Latitude : null;
}

export function sanitizeMapLongitudeParam(value: UrlParameter) {
    const parsed = sanitizeFloatInRange(value, -180, 180);
    return isValidLongitude(parsed) ? parsed as Longitude : null;
}

// Keep the rounding and transformation of zoom and center together.
export class NrwMapZoom {
    value: Zoom;

    constructor(zoom: Zoom) {
        this.value = zoom;
    }

    static fromMapboxGLMap(map: MapboxGLMap) {
        // We assume mapbox gives us valid values.
        return new NrwMapZoom(map.getZoom() as Zoom);
    }

    getRoundedForUrl() {
        return this.value.toFixed(2).toString();
    }
}

export class NrwMapCenter {
    latitude: Latitude;

    longitude: Longitude;

    private roundingPrecisionForUrl = 6;

    constructor({
        latitude, longitude, defaultLat, defaultLon,
    }: {
        latitude: Latitude | null;
        longitude: Longitude | null;
        defaultLat? : Latitude;
        defaultLon? : Longitude
    }) {
        // All this strict checking is necessary because lat/lon can also be
        // literal 0 which is falsy.

        // When we get valid values from URL or Mapbox
        // We don't want to combine a default lat with a URL lon or vice versa.
        if (latitude !== null && longitude !== null) {
            this.latitude = latitude;
            this.longitude = longitude;
            return;
        }

        // When we get invalid values from URL.
        if (defaultLat !== undefined && defaultLon !== undefined) {
            this.latitude = defaultLat;
            this.longitude = defaultLon;
            return;
        }

        // When we get invalid values from URL and no defaults are provided.
        // Erroring earlier would require a complex conditional: this is easier to read.
        throw new Error('Either lat+lon or defaultLat+defaultLon must be provided');
    }

    static fromMapboxGLMap(map: MapboxGLMap) {
        // We assume mapbox gives us valid values.
        const center = map.getCenter();
        return new NrwMapCenter({
            latitude: center.lat as Latitude,
            longitude: center.lng as Longitude,
        });
    }

    getLatitudeRoundedForUrl() {
        return this.latitude.toFixed(this.roundingPrecisionForUrl).toString();
    }

    getLongitudeRoundedForUrl() {
        return this.longitude.toFixed(this.roundingPrecisionForUrl).toString();
    }

    // MapBox expects "lat" and "lon" properties.
    get lat() {
        return this.latitude;
    }

    get lon() {
        return this.longitude;
    }
}
