import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    alertClassMapRamps,
    getEqualIntervalBreaks,
    getRampColor,
} from './colors';

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
