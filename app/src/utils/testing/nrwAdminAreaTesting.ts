import type createFakeMapboxMap from './createFakeMapboxMap';

export const adminAreaLayerId = 'layer-SSD-adminAreas';
export const unselectedAdminAreaLayerId = 'layer-SSD-adminAreas-unselected';

export function createAdminAreaProperties(placeCode: string, adminLevel: number) {
    return {
        adminLevel,
        placeCode,
        nameEn: `Name of ${placeCode}`,
    };
}

export function createAdminAreaFeature(properties: unknown) {
    return { properties };
}

export type FakeNrwMap = ReturnType<typeof createFakeMapboxMap>;

// The click handler bails when the layer is absent from the map.
export function addAdminAreaLayer(fake: FakeNrwMap, layerId = adminAreaLayerId) {
    fake.map.addLayer({
        id: layerId,
        type: 'fill',
        source: {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
        },
    });
}
