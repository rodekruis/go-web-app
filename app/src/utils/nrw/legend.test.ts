import {
    describe,
    expect,
    test,
} from 'vitest';

import createNrwLayer from '#utils/testing/createNrwLayer';

import {
    getNrwLegendItems,
    NrwLegendType,
} from './legend';

const populationDensity = createNrwLayer('populationDensity', 'Population density');

describe('getNrwLegendItems', () => {
    test('returns a ramp item for a visible population density layer', () => {
        const items = getNrwLegendItems([populationDensity], ['populationDensity']);

        expect(items).toEqual([
            expect.objectContaining({
                type: NrwLegendType.Gradient,
                layerName: 'populationDensity',
                label: 'Population density',
            }),
        ]);
        expect(items[0]?.colors).toHaveLength(5);
    });

    test('returns nothing when the layer is available but hidden', () => {
        expect(getNrwLegendItems([populationDensity], [])).toEqual([]);
    });

    test('returns nothing when the layer is visible but not available', () => {
        expect(getNrwLegendItems([], ['populationDensity'])).toEqual([]);
        expect(getNrwLegendItems(undefined, ['populationDensity'])).toEqual([]);
    });
});
