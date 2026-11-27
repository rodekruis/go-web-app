import { render } from '@testing-library/react';
import {
    describe,
    expect,
    test,
} from 'vitest';

import createFakeMapboxMap from '#utils/testing/createFakeMapboxMap';
import NrwMapTestHost from '#utils/testing/NrwMapTestHost';
import NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type Latitude,
    type Longitude,
    type LongitudeLatitudeBounds,
} from '#views/CountryProfileNationalRiskWatch/types';

import useNrwMapFitBounds from './useNrwMapFitBounds';

function createBounds(west: number, south: number, east: number, north: number) {
    return [
        new NrwLngLat(west as Longitude, south as Latitude),
        new NrwLngLat(east as Longitude, north as Latitude),
    ] as LongitudeLatitudeBounds;
}

const countyBounds = createBounds(31, 6, 32, 7);
const payamBounds = createBounds(31.2, 6.2, 31.4, 6.4);

function FitBounds(props: { bounds: LongitudeLatitudeBounds | undefined }) {
    const { bounds } = props;

    useNrwMapFitBounds(bounds);

    return null;
}

function setup(preserveMapView: boolean) {
    const fake = createFakeMapboxMap();
    const { rerender } = render(
        <NrwMapTestHost map={fake.map} preserveMapView={preserveMapView}>
            <FitBounds bounds={countyBounds} />
        </NrwMapTestHost>,
    );

    function rerenderBounds(
        bounds: LongitudeLatitudeBounds,
        newPreserveMapView = preserveMapView,
    ) {
        rerender(
            <NrwMapTestHost map={fake.map} preserveMapView={newPreserveMapView}>
                <FitBounds bounds={bounds} />
            </NrwMapTestHost>,
        );
    }

    function fitCount() {
        return fake.calls.filter((call) => call === 'fitBounds').length;
    }

    return { rerenderBounds, fitCount };
}

describe('useNrwMapFitBounds', () => {
    test('fits the map to the first bounds', () => {
        // Act
        const { fitCount } = setup(false);

        // Assert
        expect(fitCount()).toBe(1);
    });

    test('keeps the preserved map view of a link or a history entry for the first bounds', () => {
        // Act
        const { fitCount } = setup(true);

        // Assert
        expect(fitCount()).toBe(0);
    });

    test('keeps the preserved map view for later bounds, e.g. admin areas that load after the back button', () => {
        // Arrange
        const { rerenderBounds, fitCount } = setup(true);

        // Act
        rerenderBounds(payamBounds);

        // Assert
        expect(fitCount()).toBe(0);
    });

    test('does not fit when the map view is no longer preserved, as the user may have panned', () => {
        // Arrange
        const { rerenderBounds, fitCount } = setup(true);

        // Act
        rerenderBounds(countyBounds, false);

        // Assert
        expect(fitCount()).toBe(0);
    });

    test('fits the map to later bounds once the map view is no longer preserved', () => {
        // Arrange
        const { rerenderBounds, fitCount } = setup(true);
        rerenderBounds(countyBounds, false);

        // Act
        rerenderBounds(payamBounds, false);

        // Assert
        expect(fitCount()).toBe(1);
    });
});
