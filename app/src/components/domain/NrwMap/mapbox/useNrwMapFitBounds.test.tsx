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

function setup(preserveInitialView: boolean) {
    const fake = createFakeMapboxMap();
    const { rerender } = render(
        <NrwMapTestHost map={fake.map} preserveInitialView={preserveInitialView}>
            <FitBounds bounds={countyBounds} />
        </NrwMapTestHost>,
    );

    function rerenderBounds(bounds: LongitudeLatitudeBounds) {
        rerender(
            <NrwMapTestHost map={fake.map} preserveInitialView={preserveInitialView}>
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

    test('keeps the map view of a link for the first bounds', () => {
        // Act
        const { fitCount } = setup(true);

        // Assert
        expect(fitCount()).toBe(0);
    });

    test('fits the map to later bounds, also after the map view of a link', () => {
        // Arrange
        const { rerenderBounds, fitCount } = setup(true);

        // Act
        rerenderBounds(payamBounds);

        // Assert
        expect(fitCount()).toBe(1);
    });
});
