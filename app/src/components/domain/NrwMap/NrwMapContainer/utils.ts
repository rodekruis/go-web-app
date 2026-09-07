import { type Map as MapboxMap } from 'mapbox-gl-v3';

import { type NrwRasterLayerDetails } from '#views/CountryProfileNationalRiskWatch/hooks/useNrwLayers';

export function addRasterLayer(map: MapboxMap, raster: NrwRasterLayerDetails) {
    const { id, imageUrl, coordinates } = raster;
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
}

export function removeRasterLayer(map: MapboxMap, id: string) {
    if (map.getLayer(id)) {
        map.removeLayer(id);
    }
    if (map.getSource(id)) {
        map.removeSource(id);
    }
}
