import { renderHook } from '@testing-library/react';
import {
    describe,
    expect,
    test,
} from 'vitest';

import { alertClassMapRamps } from '#utils/nrw/colors';
import supportedLayerNames from '#utils/nrw/layers';
import createNrwLayer from '#utils/testing/createNrwLayer';

import {
    type NrwAdminAreaFeatureCollection,
    type NrwEvent,
    type NrwExposedAdminArea,
    NrwLegendBannerState,
    NrwLegendType,
} from '../types';
import useNrwLegendBanner from './useNrwLegendBanner';

const floodDepth = createNrwLayer('floodDepth', 'Flood depth');
const exposedPopulation = createNrwLayer('exposedPopulation', 'Exposed population');
const populationDensity = createNrwLayer('populationDensity', 'Population density');
const availableLayers = [floodDepth, exposedPopulation, populationDensity];

function createArea(placeCode: string, exposed: number | undefined): NrwExposedAdminArea {
    return {
        placeCode,
        name: placeCode,
        adminLevel: 1,
        exposure: [{ layerName: supportedLayerNames.exposedPopulation, total: null, exposed }],
    } as unknown as NrwExposedAdminArea;
}

function createEvent(areas: NrwExposedAdminArea[]): NrwEvent {
    return {
        eventId: 1,
        alertClass: 'high',
        exposedAdminAreas: { 1: areas },
    } as unknown as NrwEvent;
}

function createAdminAreas(placeCodes: string[]): NrwAdminAreaFeatureCollection {
    return {
        type: 'FeatureCollection',
        features: placeCodes.map((placeCode) => ({
            type: 'Feature',
            geometry: null,
            properties: { placeCode },
        })),
    } as unknown as NrwAdminAreaFeatureCollection;
}

const event = createEvent([createArea('SS01', 1000), createArea('SS02', 250)]);
const adminAreas = createAdminAreas(['SS01', 'SS02']);

describe('useNrwLegendBanner', () => {
    test('is empty without a selected event or events', () => {
        const { result } = renderHook(() => useNrwLegendBanner({
            selectedEvent: undefined,
            events: [],
            adminAreas: undefined,
            availableLayers,
            visibleLayers: [],
        }));

        expect(result.current).toEqual({ state: NrwLegendBannerState.Empty });
    });

    test('shows the countries legend when events are listed without a selection', () => {
        const { result } = renderHook(() => useNrwLegendBanner({
            selectedEvent: undefined,
            events: [event],
            adminAreas: undefined,
            availableLayers,
            visibleLayers: ['floodDepth'],
        }));

        expect(result.current).toEqual({ state: NrwLegendBannerState.Countries });
    });

    test('asks to turn on layers when none of the exposure layers are visible', () => {
        const { result } = renderHook(() => useNrwLegendBanner({
            selectedEvent: event,
            events: [event],
            adminAreas,
            availableLayers,
            visibleLayers: ['populationDensity'],
        }));

        expect(result.current).toEqual({ state: NrwLegendBannerState.NoLayers });
    });

    test('shows flood depth before exposed population, scaled to the drawn admin areas', () => {
        const { result } = renderHook(() => useNrwLegendBanner({
            selectedEvent: event,
            events: [event],
            adminAreas,
            availableLayers,
            visibleLayers: ['exposedPopulation', 'floodDepth'],
        }));

        expect(result.current).toEqual({
            state: NrwLegendBannerState.Event,
            items: [
                expect.objectContaining({
                    type: NrwLegendType.Gradient,
                    layerName: 'floodDepth',
                    label: 'Flood depth',
                }),
                {
                    type: NrwLegendType.Classes,
                    layerName: 'exposedPopulation',
                    label: 'Exposed population',
                    classes: [
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

    test('scales exposed population to the admin areas on the map only', () => {
        const { result } = renderHook(() => useNrwLegendBanner({
            selectedEvent: event,
            events: [event],
            adminAreas: createAdminAreas(['SS02']),
            availableLayers,
            visibleLayers: ['exposedPopulation'],
        }));

        expect(result.current).toEqual({
            state: NrwLegendBannerState.Event,
            items: [
                expect.objectContaining({
                    classes: expect.arrayContaining([
                        expect.objectContaining({ from: 200, to: undefined }),
                    ]),
                }),
            ],
        });
    });

    test('leaves out exposed population when nothing is exposed or the areas are not loaded', () => {
        const { result: noExposure } = renderHook(() => useNrwLegendBanner({
            selectedEvent: createEvent([createArea('SS01', 0)]),
            events: [event],
            adminAreas,
            availableLayers,
            visibleLayers: ['exposedPopulation'],
        }));
        const { result: noAdminAreas } = renderHook(() => useNrwLegendBanner({
            selectedEvent: event,
            events: [event],
            adminAreas: undefined,
            availableLayers,
            visibleLayers: ['exposedPopulation'],
        }));

        expect(noExposure.current).toEqual({ state: NrwLegendBannerState.Event, items: [] });
        expect(noAdminAreas.current).toEqual({ state: NrwLegendBannerState.Event, items: [] });
    });

    test('ignores visible layers that are not available', () => {
        const { result } = renderHook(() => useNrwLegendBanner({
            selectedEvent: event,
            events: [event],
            adminAreas,
            availableLayers: [populationDensity],
            visibleLayers: ['floodDepth'],
        }));

        expect(result.current).toEqual({ state: NrwLegendBannerState.NoLayers });
    });
});
