import {
    describe,
    expect,
    test,
} from 'vitest';

import { type MapFlatStyle } from '#utils/nrw/colors';
import createNrwAdminAreas from '#utils/testing/createNrwAdminAreas';

import getFlatAdminAreaLayer from './getFlatAdminAreaLayer';

const adminAreas = createNrwAdminAreas(['SS03', 'SS04']);

describe('getFlatAdminAreaLayer', () => {
    const style: MapFlatStyle = {
        fillColor: '#c6c6c6',
        fillOpacity: 0.5,
        fillHoverOpacity: 0.8,
        outlineColor: '#323232',
        outlineOpacity: 0.2,
        outlineWidth: 2,
    };

    test('fills the admin areas in the style, more opaque on hover', () => {
        // Act
        const [fill] = getFlatAdminAreaLayer('layer-SSD-adminAreas-unselected', adminAreas, style);

        // Assert
        expect(fill).toEqual({
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
        expect(outline).toEqual({
            id: 'layer-SSD-adminAreas-unselected-outline',
            type: 'line',
            source: 'layer-SSD-adminAreas-unselected',
            paint: { 'line-color': '#323232', 'line-opacity': 0.2, 'line-width': 2 },
        });
    });
});
