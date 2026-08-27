import {
    describe,
    expect,
    test,
} from 'vitest';

import NrwLngLat from './NrwLngLat';
import {
    type Latitude,
    type Longitude,
} from './types';

const lng = 32.6 as Longitude;
const lat = 0.35 as Latitude;

describe('NrwLngLat', () => {
    test('stores longitude and latitude', () => {
        // Act
        const point = new NrwLngLat(lng, lat);

        // Assert
        expect(point.lng).toBe(lng);
        expect(point.lat).toBe(lat);
    });

    describe('equals', () => {
        test('returns true for identical coordinates', () => {
            // Arrange
            const a = new NrwLngLat(lng, lat);
            const b = new NrwLngLat(lng, lat);

            // Act & Assert
            expect(a.equals(b)).toBe(true);
            expect(b.equals(a)).toBe(true);
        });

        test('returns true for itself', () => {
            // Arrange
            const a = new NrwLngLat(lng, lat);

            // Act & Assert
            expect(a.equals(a)).toBe(true);
        });

        test('returns false when longitude differs', () => {
            // Arrange
            const a = new NrwLngLat(lng, lat);
            const b = new NrwLngLat(33.6 as Longitude, lat);

            // Act & Assert
            expect(a.equals(b)).toBe(false);
        });

        test('returns false when latitude differs', () => {
            // Arrange
            const a = new NrwLngLat(lng, lat);
            const b = new NrwLngLat(lng, 1.35 as Latitude);

            // Act & Assert
            expect(a.equals(b)).toBe(false);
        });

        test('returns false when both coordinates differ', () => {
            // Arrange
            const a = new NrwLngLat(lng, lat);
            const b = new NrwLngLat(-122.42 as Longitude, 37.77 as Latitude);

            // Act & Assert
            expect(a.equals(b)).toBe(false);
        });

        test('handles boundary coordinates', () => {
            // Arrange
            const a = new NrwLngLat(-180 as Longitude, -90 as Latitude);
            const b = new NrwLngLat(-180 as Longitude, -90 as Latitude);
            const c = new NrwLngLat(180 as Longitude, 90 as Latitude);

            // Act & Assert
            expect(a.equals(b)).toBe(true);
            expect(a.equals(c)).toBe(false);
        });

        test('handles zero coordinates', () => {
            // Arrange
            const a = new NrwLngLat(0 as Longitude, 0 as Latitude);
            const b = new NrwLngLat(0 as Longitude, 0 as Latitude);

            // Act & Assert
            expect(a.equals(b)).toBe(true);
        });
    });
});
