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
    getEqualIntervalBreaks,
    getExposedPopulationScale,
    getRampCategories,
    getRampColor,
} from './colors';

function createArea(placeCode: string, exposed: number): NrwExposedAdminArea {
    return {
        placeCode,
        name: placeCode,
        adminLevel: 1,
        exposure: [{ layerName: supportedLayerNames.exposedPopulation, total: null, exposed }],
    };
}

// Only the fields the scale reads.
function createEvent(areas: NrwExposedAdminArea[]): NrwEvent {
    return {
        eventId: 1,
        alertClass: 'high',
        exposedAdminAreas: { 1: areas },
    } as unknown as NrwEvent;
}

describe('getEqualIntervalBreaks', () => {
    test('splits the range up to the maximum into five equal bands', () => {
        expect(getEqualIntervalBreaks([10, 100, 40])).toEqual([20, 40, 60, 80]);
    });

    test('scales to the magnitude of the values', () => {
        expect(getEqualIntervalBreaks([2500000])).toEqual([500000, 1000000, 1500000, 2000000]);
    });

    test('returns zero breaks when there are no values', () => {
        expect(getEqualIntervalBreaks([])).toEqual([0, 0, 0, 0]);
    });
});

describe('getRampColor', () => {
    const ramp = alertClassMapRamps.high;
    const breaks = getEqualIntervalBreaks([100]);

    test('picks the tint of the band the value falls in, starting at the break', () => {
        expect(getRampColor(ramp, breaks, 0)).toBe(ramp[0]);
        expect(getRampColor(ramp, breaks, 19)).toBe(ramp[0]);
        expect(getRampColor(ramp, breaks, 20)).toBe(ramp[1]);
        expect(getRampColor(ramp, breaks, 50)).toBe(ramp[2]);
        expect(getRampColor(ramp, breaks, 79)).toBe(ramp[3]);
        expect(getRampColor(ramp, breaks, 100)).toBe(ramp[4]);
    });

    test('uses the first tint for unknown values and when there are no breaks', () => {
        expect(getRampColor(ramp, breaks, undefined)).toBe(ramp[0]);
        expect(getRampColor(ramp, getEqualIntervalBreaks([]), 0)).toBe(ramp[0]);
    });
});

describe('getRampCategories', () => {
    test('pairs each tint with its band, open-ended at both ends', () => {
        const ramp = alertClassMapRamps.high;

        expect(getRampCategories(ramp, [200, 400, 600, 800])).toEqual([
            { color: ramp[0], from: undefined, to: 200 },
            { color: ramp[1], from: 200, to: 400 },
            { color: ramp[2], from: 400, to: 600 },
            { color: ramp[3], from: 600, to: 800 },
            { color: ramp[4], from: 800, to: undefined },
        ]);
    });
});

describe('getExposedPopulationScale', () => {
    const event = createEvent([createArea('SS01', 1000), createArea('SS02', 250)]);

    test('uses the ramp of the alert class and scales to the admin areas on the map only', () => {
        expect(getExposedPopulationScale(event, createNrwAdminAreas(['SS01', 'SS02']))).toEqual({
            ramp: alertClassMapRamps.high,
            breaks: [200, 400, 600, 800],
            exposedPopulationByPlaceCode: new Map([['SS01', 1000], ['SS02', 250]]),
        });
        expect(getExposedPopulationScale(event, createNrwAdminAreas(['SS02']))).toMatchObject({
            breaks: [50, 100, 150, 200],
        });
    });

    test('has no breaks when none of the areas has exposed population', () => {
        const noExposure = createEvent([createArea('SS01', 0)]);

        expect(getExposedPopulationScale(noExposure, createNrwAdminAreas(['SS01']))).toMatchObject({
            breaks: undefined,
        });
        expect(getExposedPopulationScale(event, createNrwAdminAreas(['SS99']))).toMatchObject({
            breaks: undefined,
        });
    });
});
