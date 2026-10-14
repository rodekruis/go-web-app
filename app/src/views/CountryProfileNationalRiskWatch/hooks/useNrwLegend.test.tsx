import {
    type ReactNode,
    useContext,
    useMemo,
} from 'react';
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

import NrwEventsContext from '../contexts/NrwEventsContext';
import NrwAdminAreasContext from '../NrwAdminAreasProvider/NrwAdminAreasContext';
import {
    type NrwEvent,
    type NrwLayerName,
    type NrwLegendPlacement,
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

function MockParentProviders(props: {
    selectedEvent: NrwEvent | undefined;
    exposedPopulationScale: NrwExposedPopulationScale | undefined;
    children: ReactNode;
}) {
    const { selectedEvent, exposedPopulationScale: scale, children } = props;

    const defaultEvents = useContext(NrwEventsContext);
    const defaultAdminAreas = useContext(NrwAdminAreasContext);
    const eventsValue = useMemo(
        () => ({ ...defaultEvents, selectedEvent }),
        [defaultEvents, selectedEvent],
    );
    const adminAreasValue = useMemo(
        () => ({ ...defaultAdminAreas, exposedPopulationScale: scale }),
        [defaultAdminAreas, scale],
    );

    return (
        <NrwEventsContext.Provider value={eventsValue}>
            <NrwAdminAreasContext.Provider value={adminAreasValue}>
                {children}
            </NrwAdminAreasContext.Provider>
        </NrwEventsContext.Provider>
    );
}

function renderLegend(options: {
    placement: NrwLegendPlacement;
    visibleLayers: NrwLayerName[];
    availableLayers?: typeof availableLayers;
    selectedEvent?: NrwEvent | undefined;
    exposedPopulationScale?: NrwExposedPopulationScale | undefined;
}) {
    const {
        placement,
        visibleLayers,
        availableLayers: layers = availableLayers,
    } = options;
    // Explicit undefined must win over the defaults.
    const selectedEvent = 'selectedEvent' in options ? options.selectedEvent : event;
    const scale = 'exposedPopulationScale' in options
        ? options.exposedPopulationScale
        : exposedPopulationScale;

    return renderHook(
        () => useNrwLegend({ placement, availableLayers: layers, visibleLayers }),
        {
            wrapper: ({ children }) => (
                <MockParentProviders
                    selectedEvent={selectedEvent}
                    exposedPopulationScale={scale}
                >
                    {children}
                </MockParentProviders>
            ),
        },
    );
}

describe('useNrwLegend', () => {
    test('reports no event without a selection, for either placement', () => {
        // Act
        const { result: banner } = renderLegend({
            placement: 'banner',
            selectedEvent: undefined,
            exposedPopulationScale: undefined,
            visibleLayers: ['floodDepth'],
        });
        const { result: panel } = renderLegend({
            placement: 'panel',
            selectedEvent: undefined,
            exposedPopulationScale: undefined,
            visibleLayers: ['populationDensity'],
        });

        // Assert
        expect(banner.current).toEqual({ state: NrwLegendState.NoEvent });
        expect(panel.current).toEqual({ state: NrwLegendState.NoEvent });
    });

    test('reports no layers when none of the placement\'s layers are visible', () => {
        // Act
        const { result: banner } = renderLegend({
            placement: 'banner',
            visibleLayers: ['populationDensity'],
        });
        const { result: panel } = renderLegend({
            placement: 'panel',
            visibleLayers: ['floodDepth', 'exposedPopulation'],
        });

        // Assert
        expect(banner.current).toEqual({ state: NrwLegendState.NoLayers });
        expect(panel.current).toEqual({ state: NrwLegendState.NoLayers });
    });

    test('shows population density in the panel only', () => {
        // Act
        const { result } = renderLegend({
            placement: 'panel',
            visibleLayers: ['populationDensity', 'floodDepth'],
        });

        // Assert
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
        // Act
        const { result } = renderLegend({
            placement: 'banner',
            visibleLayers: ['exposedPopulation', 'floodDepth', 'populationDensity'],
        });

        // Assert
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
        // Act
        const { result: noScale } = renderLegend({
            placement: 'banner',
            exposedPopulationScale: undefined,
            visibleLayers: ['exposedPopulation'],
        });
        const { result: noExposure } = renderLegend({
            placement: 'banner',
            exposedPopulationScale: { ...exposedPopulationScale, breaks: undefined },
            visibleLayers: ['exposedPopulation'],
        });

        // Assert
        expect(noScale.current).toEqual({ state: NrwLegendState.Items, items: [] });
        expect(noExposure.current).toEqual({ state: NrwLegendState.Items, items: [] });
    });

    test('ignores visible layers that are not available', () => {
        // Act
        const { result } = renderLegend({
            placement: 'banner',
            availableLayers: [populationDensity],
            visibleLayers: ['floodDepth'],
        });

        // Assert
        expect(result.current).toEqual({ state: NrwLegendState.NoLayers });
    });

    test('keeps the same legend reference across rerenders with the same input', () => {
        // Arrange
        const visibleLayers: NrwLayerName[] = ['populationDensity'];
        const { result, rerender } = renderLegend({
            placement: 'panel',
            visibleLayers,
        });
        const firstLegend = result.current;

        // Act
        rerender();

        // Assert
        expect(result.current).toBe(firstLegend);
    });
});
