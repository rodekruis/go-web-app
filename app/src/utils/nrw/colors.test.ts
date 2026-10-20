import {
    describe,
    expect,
    test,
} from 'vitest';

import supportedLayerNames from '#utils/nrw/layers';
import createNrwAdminAreas from '#utils/testing/createNrwAdminAreas';
import {
    type NrwEvent,
    type NrwExposedAdminArea,
} from '#views/CountryProfileNationalRiskWatch/types';

import {
    alertClassMapRamps,
    createRampStepGetter,
    getExposedPopulationScale,
    getRampCategories,
    getRampStepCssColor,
} from './colors';

function createArea(placeCode: string, exposed: number): NrwExposedAdminArea {
    return {
        placeCode,
        name: placeCode,
        adminLevel: 1,
        exposure: [{ layerName: supportedLayerNames.exposedPopulation, total: null, exposed }],
    };
}

function createEvent(areas: NrwExposedAdminArea[]): NrwEvent {
    return {
        eventId: 1,
        alertClass: 'high',
        exposedAdminAreas: { 1: areas },
    } as unknown as NrwEvent;
}

describe('createRampStepGetter', () => {
    const ramp = alertClassMapRamps.high;

    function getStepIndices(values: number[]) {
        const getRampStep = createRampStepGetter(ramp, values);
        return values.map((value) => ramp.indexOf(getRampStep(value)));
    }

    test('spreads fewer values than steps over the ramp, lightest to darkest', () => {
        expect(getStepIndices([1000])).toEqual([2]);
        expect(getStepIndices([1000, 10])).toEqual([3, 1]);
        expect(getStepIndices([10, 1000, 100])).toEqual([0, 4, 2]);
        expect(getStepIndices([10, 20, 30, 40])).toEqual([0, 2, 3, 4]);
    });

    test('uses every step for five values, ranked regardless of magnitude', () => {
        expect(getStepIndices([1, 2, 3, 4, 2500000])).toEqual([0, 1, 2, 3, 4]);
    });

    test('splits more values than steps into classes of equal count by rank', () => {
        expect(getStepIndices([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
            .toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
    });

    test('gives equal values the same step', () => {
        expect(getStepIndices([500, 500])).toEqual([2, 2]);
    });

    test('counts equal values per area, in the step of their first rank', () => {
        expect(getStepIndices([2553, 1833, 559, 252, 148, 130, 63, 55, 55, 32]))
            .toEqual([4, 4, 3, 3, 2, 2, 1, 0, 0, 0]);
    });

    test('keeps fewer distinct values than steps spread out, however many areas', () => {
        expect(getStepIndices([10, 10, 10, 10, 20])).toEqual([1, 1, 1, 1, 3]);
    });

    test('uses the lightest step for unknown values', () => {
        expect(createRampStepGetter(ramp, [100])(undefined)).toBe(ramp[0]);
        expect(createRampStepGetter(ramp, [])(100)).toBe(ramp[0]);
    });
});

describe('getRampCategories', () => {
    const ramp = alertClassMapRamps.high;

    function getBands(values: number[]) {
        return getRampCategories(ramp, values).map(({ from, to }) => [from, to]);
    }

    test('pairs each step with its colour', () => {
        // Act & Assert
        expect(getRampCategories(ramp, [1, 2, 3, 4, 5]).map(({ color }) => color))
            .toEqual(ramp.map(getRampStepCssColor));
    });

    test('bands each step from its lowest value, open-ended at both ends', () => {
        // Act & Assert
        expect(getBands([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toEqual([
            [undefined, 3],
            [3, 5],
            [5, 7],
            [7, 9],
            [9, undefined],
        ]);
    });

    test('extends the bands of the nearest steps to the steps without values', () => {
        // Act & Assert
        expect(getBands([1000, 10])).toEqual([
            [undefined, 10],
            [10, 505],
            [505, 1000],
            [1000, 1495],
            [1495, undefined],
        ]);
    });

    test('spreads the bands by half the value around a single value', () => {
        // Act & Assert
        expect(getBands([1000])).toEqual([
            [undefined, 500],
            [500, 1000],
            [1000, 1500],
            [1500, 2000],
            [2000, undefined],
        ]);
    });
});

describe('getExposedPopulationScale', () => {
    const event = createEvent([createArea('SS01', 1000), createArea('SS02', 250)]);
    const ramp = alertClassMapRamps.high;

    test('ranks the admin areas in the ramp of the alert class', () => {
        // Act
        const scale = getExposedPopulationScale(event, createNrwAdminAreas(['SS01', 'SS02']));

        // Assert
        expect(scale.getRampStep(1000)).toBe(ramp[3]);
        expect(scale.getRampStep(250)).toBe(ramp[1]);
        expect(scale.categories).toEqual(getRampCategories(ramp, [1000, 250]));
        expect(scale.exposedPopulationByPlaceCode).toEqual(new Map([['SS01', 1000], ['SS02', 250]]));
    });

    test('ranks the admin areas on the map only', () => {
        // Act
        const scale = getExposedPopulationScale(event, createNrwAdminAreas(['SS02']));

        // Assert
        expect(scale.getRampStep(250)).toBe(ramp[2]);
        expect(scale.categories).toEqual(getRampCategories(ramp, [250]));
    });

    test('has no categories when none of the areas has exposed population', () => {
        // Arrange
        const noExposure = createEvent([createArea('SS01', 0)]);

        // Act & Assert
        expect(getExposedPopulationScale(noExposure, createNrwAdminAreas(['SS01']))).toMatchObject({
            categories: undefined,
        });
    });

    test('has no categories when none of the exposed areas is on the map', () => {
        // Act & Assert
        expect(getExposedPopulationScale(event, createNrwAdminAreas(['SS99']))).toMatchObject({
            categories: undefined,
        });
    });
});
