import {
    type FillLayerSpecification,
    type LineLayerSpecification,
} from 'mapbox-gl-v3';
import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    alertClassMapRamps,
    type MapFlatStyle,
    mapOutlineWidth,
    type NrwExposedPopulationScale,
} from '#utils/nrw/colors';
import createNrwAdminAreas from '#utils/testing/createNrwAdminAreas';

import { type MapLayer } from '../useNrwMapLayers';
import getAdminAreaLayer, { getFlatAdminAreaLayer } from './getAdminAreaLayer';

const adminAreas = createNrwAdminAreas(['SS03', 'SS04']);

// The Mapbox addLayer parameter type does not narrow the paint by the layer type.
function getFillColor(layer: MapLayer | undefined) {
    return (layer as FillLayerSpecification | undefined)?.paint?.['fill-color'];
}

function getLineColor(layer: MapLayer | undefined) {
    return (layer as LineLayerSpecification | undefined)?.paint?.['line-color'];
}

describe('getAdminAreaLayer', () => {
    test('outlines each admin area in the colour of its fill, without transparency', () => {
        // Arrange
        const scale: NrwExposedPopulationScale = {
            ramp: alertClassMapRamps.high,
            breaks: [1000, 2000, 3000, 4000],
            exposedPopulationByPlaceCode: new Map([['SS03', 1000], ['SS04', 5000]]),
        };

        // Act
        const [fill, outline] = getAdminAreaLayer('layer-SSD-adminAreas', adminAreas, scale);

        // Assert
        expect(fill).toMatchObject({ id: 'layer-SSD-adminAreas', type: 'fill' });
        expect(getFillColor(fill)).toEqual([
            'step',
            ['coalesce', ['get', 'exposedPopulation'], 0],
            '#fef1f2',
            1000,
            '#fcc6ca',
            2000,
            '#fa999f',
            3000,
            '#f5333f',
            4000,
            '#c01825',
        ]);
        expect(outline).toMatchObject({
            id: 'layer-SSD-adminAreas-outline',
            type: 'line',
            source: 'layer-SSD-adminAreas',
            paint: { 'line-width': mapOutlineWidth },
        });
        expect(getLineColor(outline)).toEqual(getFillColor(fill));
        expect(outline?.paint).not.toHaveProperty('line-opacity');
    });

    describe('when none of the admin areas has exposed population', () => {
        const scale: NrwExposedPopulationScale = {
            ramp: alertClassMapRamps.low,
            breaks: undefined,
            exposedPopulationByPlaceCode: new Map<string, number>(),
        };

        test('fills the admin areas in the flat first tint', () => {
            // Act
            const [fill] = getAdminAreaLayer('layer-SSD-adminAreas', adminAreas, scale);

            // Assert
            expect(getFillColor(fill)).toBe(alertClassMapRamps.low[0]);
        });

        test('outlines the admin areas in the flat first tint', () => {
            // Act
            const [, outline] = getAdminAreaLayer('layer-SSD-adminAreas', adminAreas, scale);

            // Assert
            expect(getLineColor(outline)).toBe(alertClassMapRamps.low[0]);
        });
    });
});

describe('getFlatAdminAreaLayer', () => {
    const style: MapFlatStyle = {
        fillColor: '#c6c6c6',
        fillOpacity: 0.5,
        fillHoverOpacity: 0.8,
        outlineColor: 'rgba(50, 50, 50, 0.2)',
        outlineWidth: 2,
    };

    test('fills the admin areas in the style, more opaque on hover', () => {
        // Act
        const [fill] = getFlatAdminAreaLayer('layer-SSD-adminAreas-unselected', adminAreas, style);

        // Assert
        expect(fill).toMatchObject({
            id: 'layer-SSD-adminAreas-unselected',
            type: 'fill',
            source: { type: 'geojson', data: adminAreas, promoteId: 'placeCode' },
            paint: {
                'fill-color': '#c6c6c6',
                'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.8, 0.5],
            },
        });
    });

    test('outlines the admin areas in the style, from the source of the fill layer', () => {
        // Act
        const [, outline] = getFlatAdminAreaLayer('layer-SSD-adminAreas-unselected', adminAreas, style);

        // Assert
        expect(outline).toMatchObject({
            id: 'layer-SSD-adminAreas-unselected-outline',
            type: 'line',
            source: 'layer-SSD-adminAreas-unselected',
            paint: { 'line-color': 'rgba(50, 50, 50, 0.2)', 'line-width': 2 },
        });
    });
});
