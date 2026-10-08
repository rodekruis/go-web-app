import { useMemo } from 'react';
import { render } from '@testing-library/react';
import { type Map as MapboxMap } from 'mapbox-gl-v3';
import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import createFakeMapboxMap from '#utils/testing/createFakeMapboxMap';

import NrwMapContext from '../NrwMapContext';
import useNrwMapLayer from './useNrwMapLayer';

type MapLayer = Parameters<typeof useNrwMapLayer>[0];

const layerAnchorId = 'anchor-floodDepth';

function createRasterLayer(id: string): MapLayer {
    return {
        id,
        type: 'raster',
        source: {
            type: 'image',
            url: `https://nrw.example.org/${id}.png`,
            coordinates: [[33.5, 5.5], [42, 5.5], [42, -1.5], [33.5, -1.5]],
        },
    };
}

function Layer(props: { mapLayer: MapLayer | undefined; isVisible: boolean }) {
    const { mapLayer, isVisible } = props;

    useNrwMapLayer(mapLayer, isVisible, layerAnchorId);

    return null;
}

// Mirrors NrwMapContainer, which provides the map only after its style has loaded.
function MapHost(props: {
    map: MapboxMap | undefined;
    mapLayer: MapLayer | undefined;
    isVisible: boolean;
}) {
    const { map, mapLayer, isVisible } = props;

    const mapContext = useMemo(() => ({ map }), [map]);

    return (
        <NrwMapContext.Provider value={mapContext}>
            <Layer mapLayer={mapLayer} isVisible={isVisible} />
        </NrwMapContext.Provider>
    );
}

// The calls that add or remove a layer. The visibility calls are not part of the
// lifecycle order; the tests assert the visibility end state instead.
function getLifecycleCalls(calls: string[]) {
    return calls.filter((call) => !call.startsWith('setLayoutProperty'));
}

describe('useNrwMapLayer', () => {
    test('waits for the map before it adds the layer', () => {
        // Arrange
        const { map, calls, getLayerSpecification } = createFakeMapboxMap();
        const floodDepth = createRasterLayer('layer-MWI-floodDepth');

        // Act
        const { rerender } = render(<MapHost map={undefined} mapLayer={floodDepth} isVisible />);

        // Assert
        expect(calls).toEqual([]);

        // Act
        rerender(<MapHost map={map} mapLayer={floodDepth} isVisible />);

        // Assert
        expect(getLifecycleCalls(calls)).toEqual(['addLayer layer-MWI-floodDepth']);
        expect(getLayerSpecification('layer-MWI-floodDepth')).toBe(floodDepth);
    });

    test('waits for the layer specification before it adds the layer', () => {
        // Arrange
        const { map, calls, getLayerSpecification } = createFakeMapboxMap();
        const floodDepth = createRasterLayer('layer-MWI-floodDepth');

        // Act
        const { rerender } = render(<MapHost map={map} mapLayer={undefined} isVisible />);

        // Assert
        expect(calls).toEqual([]);

        // Act
        rerender(<MapHost map={map} mapLayer={floodDepth} isVisible />);

        // Assert
        expect(getLifecycleCalls(calls)).toEqual(['addLayer layer-MWI-floodDepth']);
        expect(getLayerSpecification('layer-MWI-floodDepth')).toBe(floodDepth);
    });

    test('shows a visible layer and hides a hidden layer as soon as it is added', () => {
        // Arrange
        const visible = createFakeMapboxMap();
        const hidden = createFakeMapboxMap();
        const floodDepth = createRasterLayer('layer-MWI-floodDepth');

        // Act
        render(<MapHost map={visible.map} mapLayer={floodDepth} isVisible />);
        render(<MapHost map={hidden.map} mapLayer={floodDepth} isVisible={false} />);

        // Assert
        expect(visible.getVisibility('layer-MWI-floodDepth')).toBe('visible');
        expect(hidden.getVisibility('layer-MWI-floodDepth')).toBe('none');
    });

    test('toggles the visibility without adding the layer again', () => {
        // Arrange
        const { map, calls, getVisibility } = createFakeMapboxMap();
        const floodDepth = createRasterLayer('layer-MWI-floodDepth');
        const { rerender } = render(<MapHost map={map} mapLayer={floodDepth} isVisible />);

        // Act & Assert
        rerender(<MapHost map={map} mapLayer={floodDepth} isVisible={false} />);
        expect(getVisibility('layer-MWI-floodDepth')).toBe('none');

        rerender(<MapHost map={map} mapLayer={floodDepth} isVisible />);
        expect(getVisibility('layer-MWI-floodDepth')).toBe('visible');

        // Assert
        expect(getLifecycleCalls(calls)).toEqual(['addLayer layer-MWI-floodDepth']);
    });

    test('keeps the layer across renders with the same specification', () => {
        // Arrange
        const { map, calls } = createFakeMapboxMap();
        const floodDepth = createRasterLayer('layer-MWI-floodDepth');

        // Act
        const { rerender } = render(<MapHost map={map} mapLayer={floodDepth} isVisible />);
        rerender(<MapHost map={map} mapLayer={floodDepth} isVisible />);
        rerender(<MapHost map={map} mapLayer={floodDepth} isVisible />);

        // Assert
        expect(getLifecycleCalls(calls)).toEqual(['addLayer layer-MWI-floodDepth']);
    });

    test('replaces the layer and its source when the specification changes', () => {
        // Arrange
        const {
            map,
            calls,
            getLayerSpecification,
            getVisibility,
        } = createFakeMapboxMap();
        const floodDepth = createRasterLayer('layer-MWI-floodDepth');
        const clinics = createRasterLayer('layer-MWI-clinics');

        const { rerender } = render(<MapHost map={map} mapLayer={floodDepth} isVisible />);
        calls.length = 0;

        // Act
        rerender(<MapHost map={map} mapLayer={clinics} isVisible />);

        // Assert
        expect(getLifecycleCalls(calls)).toEqual([
            'removeLayer layer-MWI-floodDepth',
            'removeSource layer-MWI-floodDepth',
            'addLayer layer-MWI-clinics',
        ]);
        expect(getLayerSpecification('layer-MWI-floodDepth')).toBeUndefined();
        expect(getLayerSpecification('layer-MWI-clinics')).toBe(clinics);
        expect(getVisibility('layer-MWI-clinics')).toBe('visible');
    });

    test('adds the layer again when a new specification has the same id', () => {
        // Arrange
        const { map, calls } = createFakeMapboxMap();
        const { rerender } = render(
            <MapHost map={map} mapLayer={createRasterLayer('layer-MWI-floodDepth')} isVisible />,
        );
        calls.length = 0;

        // Act
        rerender(
            <MapHost map={map} mapLayer={createRasterLayer('layer-MWI-floodDepth')} isVisible />,
        );

        // Assert
        // Mapbox refuses a second layer with the same id, so the old one goes first.
        expect(getLifecycleCalls(calls)).toEqual([
            'removeLayer layer-MWI-floodDepth',
            'removeSource layer-MWI-floodDepth',
            'addLayer layer-MWI-floodDepth',
        ]);
    });

    test('adds the layer below its anchor', () => {
        // Arrange
        const { map } = createFakeMapboxMap();
        const addLayer = vi.spyOn(map, 'addLayer');
        const floodDepth = createRasterLayer('layer-MWI-floodDepth');

        // Act
        render(<MapHost map={map} mapLayer={floodDepth} isVisible />);

        // Assert
        expect(addLayer.mock.calls).toEqual([[floodDepth, layerAnchorId]]);
    });

    test('removes the layer and its source on unmount', () => {
        // Arrange
        const { map, calls, getLayerSpecification } = createFakeMapboxMap();
        const floodDepth = createRasterLayer('layer-MWI-floodDepth');
        const { unmount } = render(<MapHost map={map} mapLayer={floodDepth} isVisible />);
        calls.length = 0;

        // Act
        unmount();

        // Assert
        expect(calls).toEqual([
            'removeLayer layer-MWI-floodDepth',
            'removeSource layer-MWI-floodDepth',
        ]);
        expect(getLayerSpecification('layer-MWI-floodDepth')).toBeUndefined();
        expect(map.getSource('layer-MWI-floodDepth')).toBeUndefined();
    });

    // React runs the cleanup of NrwMapContainer (map.remove()) before the cleanup of
    // this hook. Mapbox drops map.style on remove, so map.getLayer() throws in that
    // cleanup today. Enable this test together with the fix.
    test.todo('does not touch a map that was removed before the layer cleanup');
});
