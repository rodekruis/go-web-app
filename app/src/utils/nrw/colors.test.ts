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

    test('uses the lightest step for unknown values', () => {
        expect(createRampStepGetter(ramp, [100])(undefined)).toBe(ramp[0]);
        expect(createRampStepGetter(ramp, [])(100)).toBe(ramp[0]);
    });
});

describe('getRampCategories', () => {
    const ramp = alertClassMapRamps.high;

    test('spans each step from the lowest to the highest value ranked into it', () => {
        // Act & Assert
        expect(getRampCategories(ramp, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toEqual([
            { color: getRampStepCssColor(ramp[0]), from: 1, to: 2 },
            { color: getRampStepCssColor(ramp[1]), from: 3, to: 4 },
            { color: getRampStepCssColor(ramp[2]), from: 5, to: 6 },
            { color: getRampStepCssColor(ramp[3]), from: 7, to: 8 },
            { color: getRampStepCssColor(ramp[4]), from: 9, to: 10 },
        ]);
    });

    test('leaves the steps without values unbounded', () => {
        // Act & Assert
        expect(getRampCategories(ramp, [1000, 10])).toEqual([
            { color: getRampStepCssColor(ramp[0]), from: undefined, to: undefined },
            { color: getRampStepCssColor(ramp[1]), from: 10, to: 10 },
            { color: getRampStepCssColor(ramp[2]), from: undefined, to: undefined },
            { color: getRampStepCssColor(ramp[3]), from: 1000, to: 1000 },
            { color: getRampStepCssColor(ramp[4]), from: undefined, to: undefined },
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
