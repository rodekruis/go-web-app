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
        latitude, longitude, defaultLatitude, defaultLongitude,
    }: {
        latitude: Latitude | null;
        longitude: Longitude | null;
        defaultLatitude? : Latitude;
        defaultLongitude? : Longitude
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
        if (defaultLatitude !== undefined && defaultLongitude !== undefined) {
            this.latitude = defaultLatitude;
            this.longitude = defaultLongitude;
            return;
        }

        // When we get invalid values from URL and no defaults are provided.
        // Erroring earlier would require a complex conditional: this is easier to read.
        throw new Error('Either latitude+longitude or defaultLatitude+defaultLongitude must be provided');
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
