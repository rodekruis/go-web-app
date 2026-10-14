import { isDefined } from '@togglecorp/fujs';
import { type ExpressionSpecification } from 'mapbox-gl-v3';

import {
    mapFillHoverOpacity,
    mapFillOpacity,
    mapOutlineWidth,
    type NrwExposedPopulationScale,
} from '#utils/nrw/colors';
import { type NrwAdminAreaFeatureCollection } from '#views/CountryProfileNationalRiskWatch/types';

import { type MapLayer } from '../useNrwMapLayers';

const isHovered: ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false];

const exposedPopulation: ExpressionSpecification = ['coalesce', ['get', 'exposedPopulation'], 0];

// Build the choropleth layer of the admin areas, coloured by their exposed population
// in the ramp of the given alert class. A Mapbox fill layer only draws a translucent
// hairline, so the opaque outline in the same colour is a second, line layer.
function getAdminAreaLayer(
    id: string,
    adminAreas: NrwAdminAreaFeatureCollection,
    scale: NrwExposedPopulationScale,
): MapLayer[] {
    const { ramp, breaks, exposedPopulationByPlaceCode } = scale;

    // Add the exposed population to the features, so the paint expressions can read it.
    const features = adminAreas.features.map((feature) => ({
        ...feature,
        properties: {
            ...feature.properties,
            exposedPopulation: exposedPopulationByPlaceCode.get(feature.properties.placeCode),
        },
    }));

    // The step stops must ascend, so a set without exposed population gets a flat fill.
    const fillColorSpecification: ExpressionSpecification | string = isDefined(breaks)
        ? [
            'step',
            exposedPopulation,
            ramp[0],
            breaks[0],
            ramp[1],
            breaks[1],
            ramp[2],
            breaks[2],
            ramp[3],
            breaks[3],
            ramp[4],
        ]
        : ramp[0];

    return [
        {
            id,
            type: 'fill',
            source: {
                type: 'geojson',
                // The generated GeoJSON type is looser than the Mapbox one.
                data: { ...adminAreas, features } as unknown as GeoJSON.FeatureCollection,
                // Use properties.placeCode as the feature id, so the hover feature state
                // can find the feature.
                promoteId: 'placeCode',
            },
            paint: {
                'fill-color': fillColorSpecification,
                // The hovered admin area darkens.
                'fill-opacity': ['case', isHovered, mapFillHoverOpacity, mapFillOpacity],
            },
        },
        {
            id: `${id}-outline`,
            type: 'line',
            // Mapbox registers the inline source above under the id of the fill layer.
            source: id,
            paint: {
                // The outline keeps the default full opacity, where the fill is translucent.
                'line-color': fillColorSpecification,
                'line-width': mapOutlineWidth,
            },
        },
    ];
}

export default getAdminAreaLayer;
