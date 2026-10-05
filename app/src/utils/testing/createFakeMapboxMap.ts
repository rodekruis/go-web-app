import { type Map as MapboxMap } from 'mapbox-gl-v3';

type LayerSpecification = Parameters<MapboxMap['addLayer']>[0];

// The subset of the Mapbox map that the NRW layer hooks use. It records every
// call in order so a test can assert the layer lifecycle sequence.
interface FakeMapboxMap {
    map: MapboxMap;
    calls: string[];
    getLayerSpecification: (id: string) => LayerSpecification | undefined;
    getVisibility: (id: string) => string | undefined;
    getLayerOrder: () => string[];
}

function createFakeMapboxMap(): FakeMapboxMap {
    const layers = new Map<string, LayerSpecification>();
    const layerOrder: string[] = [];
    const visibilities = new Map<string, string>();
    const sources = new Set<string>();
    const calls: string[] = [];

    const fakeMap = {
        addLayer(layer: LayerSpecification, beforeId?: string) {
            calls.push(`addLayer ${layer.id}`);
            if (layers.has(layer.id)) {
                throw new Error(`Layer with id "${layer.id}" already exists on this map`);
            }
            layers.set(layer.id, layer);
            const beforeIndex = beforeId === undefined ? -1 : layerOrder.indexOf(beforeId);
            if (beforeIndex === -1) {
                layerOrder.push(layer.id);
            } else {
                layerOrder.splice(beforeIndex, 0, layer.id);
            }
            // Mapbox shows a new layer unless its layout says otherwise.
            const visibility = 'layout' in layer ? layer.layout?.visibility : undefined;
            visibilities.set(layer.id, typeof visibility === 'string' ? visibility : 'visible');
            // Mapbox registers an inline source under the id of its layer.
            if ('source' in layer && typeof layer.source === 'object') {
                sources.add(layer.id);
            }
        },
        getLayer(id: string) {
            return layers.get(id);
        },
        removeLayer(id: string) {
            calls.push(`removeLayer ${id}`);
            layers.delete(id);
            if (layerOrder.includes(id)) {
                layerOrder.splice(layerOrder.indexOf(id), 1);
            }
            visibilities.delete(id);
        },
        getSource(id: string) {
            return sources.has(id) ? { id } : undefined;
        },
        removeSource(id: string) {
            calls.push(`removeSource ${id}`);
            sources.delete(id);
        },
        setLayoutProperty(id: string, name: string, value: string) {
            calls.push(`setLayoutProperty ${id} ${name} ${value}`);
            if (name === 'visibility') {
                visibilities.set(id, value);
            }
        },
    };

    return {
        // Only the methods above are implemented.
        map: fakeMap as unknown as MapboxMap,
        calls,
        getLayerSpecification: (id) => layers.get(id),
        getVisibility: (id) => visibilities.get(id),
        getLayerOrder: () => [...layerOrder],
    };
}

export default createFakeMapboxMap;
