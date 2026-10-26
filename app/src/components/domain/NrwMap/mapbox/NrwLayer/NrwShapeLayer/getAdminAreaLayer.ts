import { type ExpressionSpecification } from 'mapbox-gl-v3';

import {
    type MapFlatStyle,
    mapOutlineColor,
    mapOutlineOpacity,
    mapOutlineWidth,
    type NrwExposedPopulationScale,
} from '#utils/nrw/colors';
import { type NrwAdminAreaFeatureCollection } from '#views/CountryProfileNationalRiskWatch/types';

import { type MapLayer } from '../useNrwMapLayers';

const isHovered: ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false];

// Build the choropleth layer of the admin areas, coloured by their exposed population
// in the ramp of the given alert class. A Mapbox fill layer only draws a hairline
// outline of a fixed width, so the outline is a second, line layer.
function getAdminAreaLayer(
    id: string,
    adminAreas: NrwAdminAreaFeatureCollection,
    scale: NrwExposedPopulationScale,
): MapLayer[] {
    const { getRampStep, exposedPopulationByPlaceCode } = scale;

    // Add the ramp step to the features, so the paint expressions can read it.
    const features = adminAreas.features.map((feature) => {
        const { color, opacity, hoverOpacity } = getRampStep(
            exposedPopulationByPlaceCode.get(feature.properties.placeCode),
        );
        return {
            ...feature,
            properties: {
                ...feature.properties,
                rampColor: color,
                rampOpacity: opacity,
                rampHoverOpacity: hoverOpacity,
            },
        };
    });

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
                'fill-color': ['get', 'rampColor'],
                // The hovered admin area darkens.
                'fill-opacity': [
                    'case',
                    isHovered,
                    ['get', 'rampHoverOpacity'],
                    ['get', 'rampOpacity'],
                ],
            },
        },
        {
            id: `${id}-outline`,
            type: 'line',
            // Mapbox registers the inline source above under the id of the fill layer.
            source: id,
            paint: {
                'line-color': mapOutlineColor,
                'line-opacity': mapOutlineOpacity,
                'line-width': mapOutlineWidth,
            },
        },
    ];
}

// Build a layer of admin areas all in the same given style, unlike the choropleth above.
export function getFlatAdminAreaLayer(
    id: string,
    adminAreas: NrwAdminAreaFeatureCollection,
    style: MapFlatStyle,
): MapLayer[] {
    return [
        {
            id,
            type: 'fill',
            source: {
                type: 'geojson',
                data: adminAreas as unknown as GeoJSON.FeatureCollection,
                promoteId: 'placeCode',
            },
            paint: {
                'fill-color': style.fillColor,
                'fill-opacity': ['case', isHovered, style.fillHoverOpacity, style.fillOpacity],
            },
        },
        {
            id: `${id}-outline`,
            type: 'line',
            source: id,
            paint: {
                'line-color': style.outlineColor,
                'line-opacity': style.outlineOpacity,
                'line-width': style.outlineWidth,
            },
        },
    ];
}

export default getAdminAreaLayer;
