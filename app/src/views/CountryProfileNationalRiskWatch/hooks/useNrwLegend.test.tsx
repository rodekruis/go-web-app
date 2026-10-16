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
    createRampStepGetter,
    floodDepthMapRamp,
    getRampCategories,
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
    getRampStep: createRampStepGetter(alertClassMapRamps.high, [1000, 250]),
    categories: getRampCategories(alertClassMapRamps.high, [1000, 250]),
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
    test.each<[NrwLegendPlacement, NrwLayerName[]]>([
        ['banner', ['floodDepth']],
        ['panel', ['populationDensity']],
    ])('reports no event without a selection, in the %s', (placement, visibleLayers) => {
        // Act
        const { result } = renderLegend({
            placement,
            selectedEvent: undefined,
            exposedPopulationScale: undefined,
            visibleLayers,
        });

        // Assert
        expect(result.current).toEqual({ state: NrwLegendState.NoEvent });
    });

    test.each<[NrwLegendPlacement, NrwLayerName[]]>([
        ['banner', ['populationDensity']],
        ['panel', ['floodDepth', 'exposedPopulation']],
    ])('reports no layers when none of the %s\'s layers are visible', (placement, visibleLayers) => {
        // Act
        const { result } = renderLegend({
            placement,
            visibleLayers,
        });

        // Assert
        expect(result.current).toEqual({ state: NrwLegendState.NoLayers });
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

    describe('in the banner with every layer visible', () => {
        const options: Parameters<typeof renderLegend>[0] = {
            placement: 'banner',
            visibleLayers: ['exposedPopulation', 'floodDepth', 'populationDensity'],
        };

        test('shows flood depth before exposed population, leaving out population density', () => {
            // Act
            const { result } = renderLegend(options);

            // Assert
            expect(result.current).toMatchObject({
                state: NrwLegendState.Items,
                items: [
                    { layerName: 'floodDepth' },
                    { layerName: 'exposedPopulation' },
                ],
            });
        });

        test('shows flood depth as a gradient of its ramp', () => {
            // Act
            const { result } = renderLegend(options);

            // Assert
            expect(result.current).toMatchObject({
                items: [
                    {
                        type: NrwLegendType.Gradient,
                        label: 'Flood depth',
                        colors: floodDepthMapRamp,
                    },
                    {},
                ],
            });
        });

        test('shows exposed population as categories of the scale', () => {
            // Act
            const { result } = renderLegend(options);

            // Assert
            expect(result.current).toMatchObject({
                items: [
                    {},
                    {
                        type: NrwLegendType.Categories,
                        label: 'Exposed population',
                        categories: exposedPopulationScale.categories,
                    },
                ],
            });
        });
    });

    test('leaves out exposed population without a scale', () => {
        // Act
        const { result } = renderLegend({
            placement: 'banner',
            exposedPopulationScale: undefined,
            visibleLayers: ['exposedPopulation'],
        });

        // Assert
        expect(result.current).toEqual({ state: NrwLegendState.Items, items: [] });
    });

    test('leaves out exposed population when nothing is exposed', () => {
        // Act
        const { result } = renderLegend({
            placement: 'banner',
            exposedPopulationScale: { ...exposedPopulationScale, categories: undefined },
            visibleLayers: ['exposedPopulation'],
        });

        // Assert
        expect(result.current).toEqual({ state: NrwLegendState.Items, items: [] });
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
