import supportedLayerNames from '#utils/nrw/layers';
import { type NrwExposedAdminArea } from '#views/CountryProfileNationalRiskWatch/types';

import type createFakeMapboxMap from './createFakeMapboxMap';

export const adminAreaLayerId = 'layer-SSD-adminAreas';
export const unselectedAdminAreaLayerId = 'layer-SSD-adminAreas-unselected';

// The test place codes nest like South Sudan's: SS, SS03, SS0303, SS030301.
function getAdminLevel(placeCode: string) {
    return (placeCode.length - 2) / 2;
}

// An exposed admin area of an event, as /events returns it.
export function createExposedArea(placeCode: string, name = placeCode): NrwExposedAdminArea {
    return {
        placeCode,
        name,
        adminLevel: getAdminLevel(placeCode),
        exposure: [{ layerName: supportedLayerNames.exposedPopulation, total: null, exposed: 1 }],
    };
}

// A square admin area with its south-west corner at (west, south), with the place codes
// of its parents, as /admin-areas returns it.
export function createSquareAdminAreaFeature(placeCode: string, west: number, south: number) {
    const adminLevel = getAdminLevel(placeCode);
    const parentPlaceCodes = Object.fromEntries(
        Array.from({ length: adminLevel - 1 }, (_, index) => [
            `placeCodeLevel${index + 1}`,
            placeCode.slice(0, 4 + 2 * index),
        ]),
    );

    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [west, south],
                [west + 1, south],
                [west + 1, south + 1],
                [west, south + 1],
                [west, south],
            ]],
        },
        properties: {
            adminLevel,
            placeCode,
            nameEn: placeCode,
            ...parentPlaceCodes,
        },
    };
}

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
