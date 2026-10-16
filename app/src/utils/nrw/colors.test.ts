import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    alertClassMapRamps,
    createRampStepGetter,
} from './colors';

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
