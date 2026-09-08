import { type Map as MapboxMap } from 'mapbox-gl-v3';

import { type NrwRasterLayerDetails } from '#views/CountryProfileNationalRiskWatch/hooks/useNrwLayers';

export default function syncRasterLayers(
    map: MapboxMap,
    rastersDetails: NrwRasterLayerDetails[],
    loadedIds: Set<string>,
) {
    const allRasterLayerIds = new Set(rastersDetails.map(({ id }) => id));

    // Remove existing layers from the map layers, map sources, and tracked ids
    loadedIds.forEach((id) => {
        if (allRasterLayerIds.has(id)) {
            return;
        }
        if (map.getLayer(id)) {
            map.removeLayer(id);
        }
        if (map.getSource(id)) {
            map.removeSource(id);
        }
        loadedIds.delete(id);
    });

    // Add any new layers to the map layers, map sources, and tracked ids
    rastersDetails.forEach(({ id, imageUrl, coordinates }) => {
        if (loadedIds.has(id)) {
            return;
        }
        if (!map.getSource(id)) {
            map.addSource(id, { type: 'image', url: imageUrl, coordinates });
        }
        if (!map.getLayer(id)) {
            map.addLayer({
                id,
                type: 'raster',
                source: id,
                paint: {
                    'raster-resampling': 'nearest',
                },
            });
        }
        loadedIds.add(id);
    });
}
