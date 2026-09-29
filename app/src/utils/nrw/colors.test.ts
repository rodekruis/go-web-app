import {
    describe,
    expect,
    test,
} from 'vitest';

import { getEqualIntervalBreaks } from './colors';

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
