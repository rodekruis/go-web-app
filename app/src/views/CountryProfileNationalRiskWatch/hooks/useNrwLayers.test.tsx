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
        // Act
        const { result } = renderNrwLayers();

        // Assert
        expect(useNrwRequest).toHaveBeenLastCalledWith({
            url: '/layers',
            apiType: 'nrw',
            query: undefined,
        });
        expect(result.current.availableLayers).toEqual(availableLayers);

        // Act
        renderNrwLayers({ hazardType: 'floods' });

        // Assert
        expect(useNrwRequest).toHaveBeenLastCalledWith({
            url: '/layers',
            apiType: 'nrw',
            query: { hazardType: 'floods' },
        });
    });

    test('shows a hidden layer after its toggle, behind the visible ones', () => {
        // Arrange
        const { result, onVisibleLayersChange } = renderNrwLayers({
            visibleLayers: ['floodDepth'],
        });

        // Act
        act(() => {
            result.current.handleLayerToggle('clinics');
        });

        // Assert
        expect(onVisibleLayersChange).toHaveBeenCalledExactlyOnceWith(['floodDepth', 'clinics']);
    });

    test('includes both the static and the event layers', () => {
        // Arrange
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

        // Act
        const { result } = renderNrwLayers({
            selectedEvent: { availableLayers: [...eventLayers] },
        });

        // Assert
        expect(result.current.availableLayers).toHaveLength(2);
        expect(result.current.availableLayers)
            .toEqual(expect.arrayContaining([availableLayers[1], eventLayers[0]]));
    });

    test('shows event layers before static layers arrive', () => {
        // Arrange
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

        // Act
        const { result } = renderNrwLayers({
            selectedEvent: { availableLayers: [...eventLayers] },
        });

        // Assert
        expect(result.current.availableLayers).toEqual(eventLayers);
    });

    test('hides a visible layer after its toggle', () => {
        // Arrange
        const { result, onVisibleLayersChange } = renderNrwLayers({
            visibleLayers: ['floodDepth', 'clinics'],
        });

        // Act
        act(() => {
            result.current.handleLayerToggle('floodDepth');
        });

        // Assert
        expect(onVisibleLayersChange).toHaveBeenCalledExactlyOnceWith(['clinics']);
    });

    test('shows the first layer when no layer is visible', () => {
        // Arrange
        const { result, onVisibleLayersChange } = renderNrwLayers();

        // Act
        act(() => {
            result.current.handleLayerToggle('clinics');
        });

        // Assert
        expect(onVisibleLayersChange).toHaveBeenCalledExactlyOnceWith(['clinics']);
    });

    test('does not change the layers itself but reports the new list', () => {
        // Arrange
        const visibleLayers: NrwLayerName[] = ['floodDepth'];
        const { result } = renderNrwLayers({ visibleLayers });

        // Act
        act(() => {
            result.current.handleLayerToggle('clinics');
        });

        // Assert
        // The url owns the visible layers; the hook only reports the change.
        expect(result.current.visibleLayers).toBe(visibleLayers);
        expect(visibleLayers).toEqual(['floodDepth']);
    });
});
