import { renderHook } from '@testing-library/react';
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import { useNrwRequest } from '#utils/restRequest';

import NrwLngLat from '../NrwLngLat';
import {
    type CountryCodeIso3,
    type Latitude,
    type Longitude,
    type Zoom,
} from '../types';
import useNrwMapView from './useNrwMapView';

vi.mock('#utils/restRequest', () => ({ useNrwRequest: vi.fn() }));

// One square country around (40.5, 10.5), as returned by /admin-areas.
const country = {
    type: 'FeatureCollection',
    features: [{
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [[[40, 10], [41, 10], [41, 11], [40, 11], [40, 10]]] },
        properties: { adminLevel: 0, placeCode: 'ET', nameEn: 'Ethiopia' },
    }],
};

function renderMapView(url: {
    zoom: number | null;
    latitude: number | null;
    longitude: number | null;
    isHistoryNavigation?: boolean;
}) {
    return renderHook(
        (props: typeof url) => useNrwMapView({
            urlZoom: props.zoom as Zoom | null,
            urlLatitude: props.latitude as Latitude | null,
            urlLongitude: props.longitude as Longitude | null,
            countries: ['ETH' as CountryCodeIso3],
            countriesPending: false,
            isHistoryNavigation: props.isHistoryNavigation ?? true,
        }),
        { initialProps: url },
    );
}

describe('useNrwMapView', () => {
    beforeEach(() => {
        vi.mocked(useNrwRequest).mockReset().mockReturnValue({
            response: country,
            pending: false,
            error: undefined,
        } as unknown as ReturnType<typeof useNrwRequest>);
    });

    test('takes the map view of a link from the url, and keeps it', () => {
        // Act
        const { result } = renderMapView({ zoom: 9.42, latitude: 10.897015, longitude: 40.473302 });

        // Assert
        expect(result.current.mapView).toEqual({
            center: new NrwLngLat(40.473302 as Longitude, 10.897015 as Latitude),
            zoom: 9.42,
            // So the map moves to it on the browser back and forward buttons.
            followCenterAndZoom: true,
        });
        expect(result.current.preserveMapView).toBe(true);
    });

    test('fits the map to the countries without a map view in the url', () => {
        // Act
        const { result } = renderMapView({ zoom: null, latitude: null, longitude: null });

        // Assert
        expect(result.current.mapView.fitBounds).toEqual([
            new NrwLngLat(40 as Longitude, 10 as Latitude),
            new NrwLngLat(41 as Longitude, 11 as Latitude),
        ]);
        expect(result.current.mapView.followCenterAndZoom).toBeUndefined();
        expect(result.current.preserveMapView).toBe(false);
    });

    test('does not keep the map view that the map wrote to the url itself', () => {
        // Arrange: the url gets a map view after the page opened without one.
        const { result, rerender } = renderMapView({ zoom: null, latitude: null, longitude: null });

        // Act
        rerender({
            zoom: 9.42,
            latitude: 10.897015,
            longitude: 40.473302,
            isHistoryNavigation: false,
        });

        // Assert
        expect(result.current.preserveMapView).toBe(false);
    });

    test('keeps the map view of a history entry, after the back or forward button', () => {
        // Arrange
        const { result, rerender } = renderMapView({
            zoom: 9.42,
            latitude: 10.897015,
            longitude: 40.473302,
            isHistoryNavigation: false,
        });

        // Act
        rerender({
            zoom: 7.1,
            latitude: 10.5,
            longitude: 40.5,
            isHistoryNavigation: true,
        });

        // Assert
        expect(result.current.preserveMapView).toBe(true);
    });
});
