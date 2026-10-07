import { renderHook } from '@testing-library/react';
import {
    describe,
    expect,
    test,
} from 'vitest';

import createNrwLayer from '#utils/testing/createNrwLayer';

import { type NrwLayer } from '../types';
import useNrwLegend from './useNrwLegend';

const populationDensity = createNrwLayer('populationDensity', 'Population density');

describe('useNrwLegend', () => {
    test('returns the legend items for the visible layers when enabled', () => {
        const { result } = renderHook(() => useNrwLegend({
            availableLayers: [populationDensity],
            visibleLayers: ['populationDensity'],
            enabled: true,
        }));

        expect(result.current.legendItems).toHaveLength(1);
        expect(result.current.legendItems[0]?.layerName).toBe('populationDensity');
    });

    test('returns no items when disabled, even if layers are visible', () => {
        const { result } = renderHook(() => useNrwLegend({
            availableLayers: [populationDensity],
            visibleLayers: ['populationDensity'],
            enabled: false,
        }));

        expect(result.current.legendItems).toEqual([]);
    });

    test('keeps the same items reference across rerenders with the same input', () => {
        const visibleLayers: NrwLayer['name'][] = ['populationDensity'];
        const availableLayers = [populationDensity];

        const { result, rerender } = renderHook(() => useNrwLegend({
            availableLayers,
            visibleLayers,
            enabled: true,
        }));
        const firstItems = result.current.legendItems;

        rerender();

        expect(result.current.legendItems).toBe(firstItems);
    });
});
