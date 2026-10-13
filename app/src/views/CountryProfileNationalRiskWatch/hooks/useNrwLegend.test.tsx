import { renderHook } from '@testing-library/react';
import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    alertClassMapRamps,
    floodDepthMapRamp,
    type NrwExposedPopulationScale,
} from '#utils/nrw/colors';
import createNrwLayer from '#utils/testing/createNrwLayer';

import {
    type NrwEvent,
    type NrwLayerName,
    NrwLegendState,
    NrwLegendType,
} from '../types';
import useNrwLegend from './useNrwLegend';

const floodDepth = createNrwLayer('floodDepth', 'Flood depth');
const exposedPopulation = createNrwLayer('exposedPopulation', 'Exposed population');
const populationDensity = createNrwLayer('populationDensity', 'Population density');
const availableLayers = [floodDepth, exposedPopulation, populationDensity];

const event = { eventId: 1, alertClass: 'high' } as unknown as NrwEvent;
const exposedPopulationScale: NrwExposedPopulationScale = {
    ramp: alertClassMapRamps.high,
    breaks: [200, 400, 600, 800],
    exposedPopulationByPlaceCode: new Map([['SS01', 1000], ['SS02', 250]]),
};

describe('useNrwLegend', () => {
    test('reports no event without a selection, for either placement', () => {
        const { result: banner } = renderHook(() => useNrwLegend({
            placement: 'banner',
            selectedEvent: undefined,
            exposedPopulationScale: undefined,
            availableLayers,
            visibleLayers: ['floodDepth'],
        }));
        const { result: panel } = renderHook(() => useNrwLegend({
            placement: 'panel',
            selectedEvent: undefined,
            exposedPopulationScale: undefined,
            availableLayers,
            visibleLayers: ['populationDensity'],
        }));

        expect(banner.current).toEqual({ state: NrwLegendState.NoEvent });
        expect(panel.current).toEqual({ state: NrwLegendState.NoEvent });
    });

    test('reports no layers when none of the placement\'s layers are visible', () => {
        const { result: banner } = renderHook(() => useNrwLegend({
            placement: 'banner',
            selectedEvent: event,
            exposedPopulationScale,
            availableLayers,
            visibleLayers: ['populationDensity'],
        }));
        const { result: panel } = renderHook(() => useNrwLegend({
            placement: 'panel',
            selectedEvent: event,
            exposedPopulationScale,
            availableLayers,
            visibleLayers: ['floodDepth', 'exposedPopulation'],
        }));

        expect(banner.current).toEqual({ state: NrwLegendState.NoLayers });
        expect(panel.current).toEqual({ state: NrwLegendState.NoLayers });
    });

    test('shows population density in the panel only', () => {
        const { result } = renderHook(() => useNrwLegend({
            placement: 'panel',
            selectedEvent: event,
            exposedPopulationScale,
            availableLayers,
            visibleLayers: ['populationDensity', 'floodDepth'],
        }));

        expect(result.current).toEqual({
            state: NrwLegendState.Items,
            items: [
                {
                    type: NrwLegendType.Gradient,
                    layerName: 'populationDensity',
                    label: 'Population density',
                    colors: Array(5).fill(expect.stringMatching(/^var\(--go-ui-color-gray-\d+\)$/)),
                },
            ],
        });
    });

    test('shows flood depth before exposed population in the banner, as categories of the scale', () => {
        const { result } = renderHook(() => useNrwLegend({
            placement: 'banner',
            selectedEvent: event,
            exposedPopulationScale,
            availableLayers,
            visibleLayers: ['exposedPopulation', 'floodDepth', 'populationDensity'],
        }));

        expect(result.current).toEqual({
            state: NrwLegendState.Items,
            items: [
                {
                    type: NrwLegendType.Gradient,
                    layerName: 'floodDepth',
                    label: 'Flood depth',
                    colors: floodDepthMapRamp,
                },
                {
                    type: NrwLegendType.Categories,
                    layerName: 'exposedPopulation',
                    label: 'Exposed population',
                    categories: [
                        { color: alertClassMapRamps.high[0], from: undefined, to: 200 },
                        { color: alertClassMapRamps.high[1], from: 200, to: 400 },
                        { color: alertClassMapRamps.high[2], from: 400, to: 600 },
                        { color: alertClassMapRamps.high[3], from: 600, to: 800 },
                        { color: alertClassMapRamps.high[4], from: 800, to: undefined },
                    ],
                },
            ],
        });
    });

    test('leaves out exposed population without a scale or when nothing is exposed', () => {
        const { result: noScale } = renderHook(() => useNrwLegend({
            placement: 'banner',
            selectedEvent: event,
            exposedPopulationScale: undefined,
            availableLayers,
            visibleLayers: ['exposedPopulation'],
        }));
        const { result: noExposure } = renderHook(() => useNrwLegend({
            placement: 'banner',
            selectedEvent: event,
            exposedPopulationScale: { ...exposedPopulationScale, breaks: undefined },
            availableLayers,
            visibleLayers: ['exposedPopulation'],
        }));

        expect(noScale.current).toEqual({ state: NrwLegendState.Items, items: [] });
        expect(noExposure.current).toEqual({ state: NrwLegendState.Items, items: [] });
    });

    test('ignores visible layers that are not available, or not loaded yet', () => {
        const { result: notAvailable } = renderHook(() => useNrwLegend({
            placement: 'banner',
            selectedEvent: event,
            exposedPopulationScale,
            availableLayers: [populationDensity],
            visibleLayers: ['floodDepth'],
        }));
        const { result: notLoaded } = renderHook(() => useNrwLegend({
            placement: 'banner',
            selectedEvent: event,
            exposedPopulationScale,
            availableLayers: undefined,
            visibleLayers: ['floodDepth'],
        }));

        expect(notAvailable.current).toEqual({ state: NrwLegendState.NoLayers });
        expect(notLoaded.current).toEqual({ state: NrwLegendState.NoLayers });
    });

    test('keeps the same legend reference across rerenders with the same input', () => {
        const visibleLayers: NrwLayerName[] = ['populationDensity'];

        const { result, rerender } = renderHook(() => useNrwLegend({
            placement: 'panel',
            selectedEvent: event,
            exposedPopulationScale,
            availableLayers,
            visibleLayers,
        }));
        const firstLegend = result.current;

        rerender();

        expect(result.current).toBe(firstLegend);
    });
});
