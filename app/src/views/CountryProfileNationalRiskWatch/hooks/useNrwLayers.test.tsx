import {
    act,
    renderHook,
} from '@testing-library/react';
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import { useNrwRequest } from '#utils/restRequest';

import {
    type NrwLayerName,
    type NrwStaticLayer,
} from '../types';
import useNrwLayers from './useNrwLayers';

vi.mock('#utils/restRequest', () => ({ useNrwRequest: vi.fn() }));

const availableLayers: NrwStaticLayer[] = [
    {
        id: 1,
        name: 'floodDepth',
        label: 'Flood depth',
        type: 'raster',
        description: undefined,
        hazardType: 'floods',
    },
    {
        id: 2,
        name: 'clinics',
        label: 'Clinics',
        type: 'point',
        description: undefined,
        hazardType: undefined,
    },
];

function renderNrwLayers(props: Partial<Parameters<typeof useNrwLayers>[0]> = {}) {
    const onVisibleLayersChange = vi.fn();

    const { result } = renderHook(() => useNrwLayers({
        visibleLayers: [],
        onVisibleLayersChange,
        ...props,
    }));

    return { result, onVisibleLayersChange };
}

describe('useNrwLayers', () => {
    beforeEach(() => {
        vi.mocked(useNrwRequest).mockReset().mockReturnValue({
            response: availableLayers,
            pending: false,
            error: undefined,
        } as unknown as ReturnType<typeof useNrwRequest>);
    });

    test('requests all layers unless a hazard type is given', () => {
        const { result } = renderNrwLayers();

        expect(useNrwRequest).toHaveBeenLastCalledWith({
            url: '/layers',
            apiType: 'nrw',
            query: undefined,
        });
        expect(result.current.availableLayers).toEqual(availableLayers);

        renderNrwLayers({ hazardType: 'floods' });

        expect(useNrwRequest).toHaveBeenLastCalledWith({
            url: '/layers',
            apiType: 'nrw',
            query: { hazardType: 'floods' },
        });
    });

    test('shows a hidden layer after its toggle, behind the visible ones', () => {
        const { result, onVisibleLayersChange } = renderNrwLayers({
            visibleLayers: ['floodDepth'],
        });

        act(() => {
            result.current.handleLayerToggle('clinics');
        });

        expect(onVisibleLayersChange).toHaveBeenCalledExactlyOnceWith(['floodDepth', 'clinics']);
    });

    test('includes both the static and the event layers', () => {
        vi.mocked(useNrwRequest).mockReturnValue({
            response: [availableLayers[1]],
            pending: false,
            error: undefined,
        } as unknown as ReturnType<typeof useNrwRequest>);
        const eventLayers = [{
            resourceId: '10',
            name: 'floodDepth',
            label: 'Flood depth',
            type: 'raster',
        }] as const;
        const { result } = renderNrwLayers({
            selectedEvent: { availableLayers: [...eventLayers] },
        });

        expect(result.current.availableLayers).toHaveLength(2);
        expect(result.current.availableLayers)
            .toEqual(expect.arrayContaining([availableLayers[1], eventLayers[0]]));
    });

    test('shows event layers before static layers arrive', () => {
        vi.mocked(useNrwRequest).mockReturnValue({
            response: undefined,
            pending: true,
            error: undefined,
        } as unknown as ReturnType<typeof useNrwRequest>);
        const eventLayers = [{
            resourceId: '10',
            name: 'floodDepth',
            label: 'Flood depth',
            type: 'raster',
        }] as const;
        const { result } = renderNrwLayers({
            selectedEvent: { availableLayers: [...eventLayers] },
        });

        expect(result.current.availableLayers).toEqual(eventLayers);
    });

    test('hides a visible layer after its toggle', () => {
        const { result, onVisibleLayersChange } = renderNrwLayers({
            visibleLayers: ['floodDepth', 'clinics'],
        });

        act(() => {
            result.current.handleLayerToggle('floodDepth');
        });

        expect(onVisibleLayersChange).toHaveBeenCalledExactlyOnceWith(['clinics']);
    });

    test('shows the first layer when no layer is visible', () => {
        const { result, onVisibleLayersChange } = renderNrwLayers();

        act(() => {
            result.current.handleLayerToggle('clinics');
        });

        expect(onVisibleLayersChange).toHaveBeenCalledExactlyOnceWith(['clinics']);
    });

    test('does not change the layers itself but reports the new list', () => {
        const visibleLayers: NrwLayerName[] = ['floodDepth'];
        const { result } = renderNrwLayers({ visibleLayers });

        act(() => {
            result.current.handleLayerToggle('clinics');
        });

        // The url owns the visible layers; the hook only reports the change.
        expect(result.current.visibleLayers).toBe(visibleLayers);
        expect(visibleLayers).toEqual(['floodDepth']);
    });
});
