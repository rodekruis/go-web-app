import {
    type FillLayerSpecification,
    type GeoJSONSourceSpecification,
} from 'mapbox-gl-v3';
import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    alertClassMapRamps,
    createRampStepGetter,
    mapOutlineColor,
    mapOutlineOpacity,
    mapOutlineWidth,
    type NrwExposedPopulationScale,
} from '#utils/nrw/colors';
import createNrwAdminAreas from '#utils/testing/createNrwAdminAreas';

import { type MapLayer } from '../useNrwMapLayers';
import getAdminAreaLayer from './getAdminAreaLayer';

const adminAreas = createNrwAdminAreas(['SS03', 'SS04']);

function createScale(
    alertClass: keyof typeof alertClassMapRamps,
    exposedPopulationByPlaceCode: Map<string, number>,
): NrwExposedPopulationScale {
    return {
        getRampStep: createRampStepGetter(
            alertClassMapRamps[alertClass],
            [...exposedPopulationByPlaceCode.values()],
        ),
        categories: undefined,
        exposedPopulationByPlaceCode,
    };
}

// The Mapbox addLayer parameter type does not narrow the paint by the layer type.
function getFillPaint(layer: MapLayer | undefined) {
    return (layer as FillLayerSpecification | undefined)?.paint;
}

function getFeatureProperties(layer: MapLayer | undefined) {
    const { source } = layer as FillLayerSpecification & { source: GeoJSONSourceSpecification };
    return (source.data as GeoJSON.FeatureCollection).features
        .map((feature) => feature.properties);
}

describe('getAdminAreaLayer', () => {
    test('colours each admin area in the ramp step of its exposed population', () => {
        // Arrange
        const scale = createScale('high', new Map([['SS03', 1000], ['SS04', 5000]]));
        const ramp = alertClassMapRamps.high;

        // Act
        const [fill] = getAdminAreaLayer('layer-SSD-adminAreas', adminAreas, scale);

        // Assert
        expect(fill).toMatchObject({ id: 'layer-SSD-adminAreas', type: 'fill' });
        expect(getFeatureProperties(fill)).toMatchObject([
            {
                placeCode: 'SS03',
                rampColor: ramp[1].color,
                rampOpacity: ramp[1].opacity,
                rampHoverOpacity: ramp[1].hoverOpacity,
            },
            {
                placeCode: 'SS04',
                rampColor: ramp[3].color,
                rampOpacity: ramp[3].opacity,
                rampHoverOpacity: ramp[3].hoverOpacity,
            },
        ]);
        expect(getFillPaint(fill)).toEqual({
            'fill-color': ['get', 'rampColor'],
            'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                ['get', 'rampHoverOpacity'],
                ['get', 'rampOpacity'],
            ],
        });
    });

    test('outlines each admin area in the map shadow outline', () => {
        // Arrange
        const scale = createScale('high', new Map([['SS03', 1000], ['SS04', 5000]]));

        // Act
        const [, outline] = getAdminAreaLayer('layer-SSD-adminAreas', adminAreas, scale);

        // Assert
        expect(outline).toEqual({
            id: 'layer-SSD-adminAreas-outline',
            type: 'line',
            source: 'layer-SSD-adminAreas',
            paint: {
                'line-color': mapOutlineColor,
                'line-opacity': mapOutlineOpacity,
                'line-width': mapOutlineWidth,
            },
        });
    });

    test('colours the admin areas in the lightest step when none has exposed population', () => {
        // Arrange
        const scale = createScale('low', new Map<string, number>());

        // Act
        const [fill] = getAdminAreaLayer('layer-SSD-adminAreas', adminAreas, scale);

        // Assert
        expect(getFeatureProperties(fill).map((properties) => properties?.rampColor))
            .toEqual([alertClassMapRamps.low[0].color, alertClassMapRamps.low[0].color]);
    });
});
