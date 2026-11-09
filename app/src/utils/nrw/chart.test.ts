import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    getNrwTagCenter,
    getNrwTagWidth,
    spreadNrwLabelPositions,
} from './chart';

describe('getNrwTagCenter', () => {
    const bounds = { min: 50, max: 300 };
    const label = 'Start High threshold';
    const halfWidth = getNrwTagWidth(label) / 2;

    test('centres the tag on its marker when it fits', () => {
        expect(getNrwTagCenter(175, label, bounds)).toBe(175);
    });

    test('moves the tag inwards to end at the right bound', () => {
        // Arrange: a marker near the right edge, like a peak on the last forecast days
        const center = getNrwTagCenter(290, label, bounds);

        // Assert
        expect(center + halfWidth).toBe(bounds.max);
    });

    test('moves the tag inwards to start at the left bound', () => {
        // Arrange: a marker near the left edge, like a start on the second forecast day
        const center = getNrwTagCenter(60, label, bounds);

        // Assert
        expect(center - halfWidth).toBe(bounds.min);
    });
});

describe('spreadNrwLabelPositions', () => {
    const bounds = { min: 0, max: 100 };

    test('keeps labels that are far enough apart', () => {
        expect(spreadNrwLabelPositions([10, 40, 70], 12, bounds)).toEqual([10, 40, 70]);
    });

    test('spreads close labels evenly around their positions', () => {
        // Arrange: like 2 and 1.5 year thresholds of 185 and 170
        const spread = spreadNrwLabelPositions([60, 65], 12, bounds);

        // Assert
        expect(spread).toEqual([56.5, 68.5]);
    });

    test('keeps the order of the labels, whatever the order of the input', () => {
        expect(spreadNrwLabelPositions([65, 60], 12, bounds)).toEqual([68.5, 56.5]);
    });

    test('spreads a chain of close labels as one group', () => {
        expect(spreadNrwLabelPositions([40, 45, 50], 12, bounds)).toEqual([33, 45, 57]);
    });

    test('keeps labels within the bounds', () => {
        expect(spreadNrwLabelPositions([1, 3], 12, bounds)).toEqual([0, 12]);
        expect(spreadNrwLabelPositions([97, 99], 12, bounds)).toEqual([88, 100]);
    });

    test('keeps the gap when a group is moved back within the bounds', () => {
        // Arrange: the top group moves down, onto the label below it
        const spread = spreadNrwLabelPositions([0, 2, 22], 12, bounds);

        // Assert
        expect(spread[1]! - spread[0]!).toBeGreaterThanOrEqual(12);
        expect(spread[2]! - spread[1]!).toBeGreaterThanOrEqual(12);
        expect(spread[0]).toBeGreaterThanOrEqual(0);
    });

    test('keeps the bottom bound when a group is moved back onto the label above it', () => {
        // Arrange: the bottom group moves up, onto the label above it
        const spread = spreadNrwLabelPositions([78, 98, 100], 12, bounds);

        // Assert: the label above moves up instead of the group passing the bottom bound
        expect(spread).toEqual([76, 88, 100]);
    });
});
