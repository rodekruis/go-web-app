import { renderHook } from '@testing-library/react';
import {
    describe,
    expect,
    test,
} from 'vitest';

import createNrwLayer from '#utils/testing/createNrwLayer';

import {
    type NrwLayer,
    NrwLegendType,
} from '../types';
import useNrwLegend from './useNrwLegend';

const populationDensity = createNrwLayer('populationDensity', 'Population density');

describe('useNrwLegend', () => {
    test('returns a ramp item for a visible population density layer when enabled', () => {
        const { result } = renderHook(() => useNrwLegend({
            availableLayers: [populationDensity],
            visibleLayers: ['populationDensity'],
            enabled: true,
        }));

        expect(result.current.legendItems).toEqual([
            expect.objectContaining({
                type: NrwLegendType.Gradient,
                layerName: 'populationDensity',
                label: 'Population density',
            }),
        ]);
        expect(result.current.legendItems[0]?.colors).toHaveLength(5);
    });

    test('returns nothing when the layer is available but hidden', () => {
        const { result } = renderHook(() => useNrwLegend({
            availableLayers: [populationDensity],
            visibleLayers: [],
            enabled: true,
        }));

        expect(result.current.legendItems).toEqual([]);
    });

    test('returns nothing when the layer is visible but not available', () => {
        const { result: empty } = renderHook(() => useNrwLegend({
            availableLayers: [],
            visibleLayers: ['populationDensity'],
            enabled: true,
        }));
        const { result: undefinedLayers } = renderHook(() => useNrwLegend({
            availableLayers: undefined,
            visibleLayers: ['populationDensity'],
            enabled: true,
        }));

        expect(empty.current.legendItems).toEqual([]);
        expect(undefinedLayers.current.legendItems).toEqual([]);
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
