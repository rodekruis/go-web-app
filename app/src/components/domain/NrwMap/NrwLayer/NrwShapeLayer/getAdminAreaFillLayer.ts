import { isDefined } from '@togglecorp/fujs';
import { type ExpressionSpecification } from 'mapbox-gl-v3';

import {
    alertClassMapRamps,
    getEqualIntervalBreaks,
    mapFillHoverOpacity,
    mapFillOpacity,
    mapOutlineColor,
} from '#utils/nrw/colors';
import {
    type NrwAdminAreaFeatureCollection,
    type NrwEvent,
} from '#views/CountryProfileNationalRiskWatch/types';

import type useNrwMapLayer from '../useNrwMapLayer';

type MapLayer = NonNullable<Parameters<typeof useNrwMapLayer>[0]>;

const isHovered: ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false];

// Mapbox stringifies nested GeoJSON properties, so read the flattened population.
const population: ExpressionSpecification = ['coalesce', ['get', 'population'], 0];

// Build the choropleth fill layer of the admin areas, coloured by population
// in the ramp of the given alert class.
function getAdminAreaFillLayer(
    id: string,
    adminAreas: NrwAdminAreaFeatureCollection,
    alertClass: NrwEvent['alertClass'],
): MapLayer {
    // Flatten the population, so the paint expressions can read it.
    const features = adminAreas.features.map((feature) => ({
        ...feature,
        properties: {
            ...feature.properties,
            population: feature.properties.attributes.POPULATION,
        },
    }));
    const populations = features
        .map((feature) => feature.properties.population)
        .filter(isDefined);
    const breaks = getEqualIntervalBreaks(populations);
    const ramp = alertClassMapRamps[alertClass];

    // The step stops must ascend, so a set without population gets a flat fill.
    const fillColor: ExpressionSpecification | string = breaks[0] > 0
        ? [
            'step',
            population,
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

    return {
        id,
        type: 'fill',
        source: {
            type: 'geojson',
            // The generated GeoJSON type is looser than the Mapbox one.
            data: { ...adminAreas, features } as unknown as GeoJSON.FeatureCollection,
            // Use properties.id, so the hover feature state can find the feature.
            promoteId: 'id',
        },
        paint: {
            'fill-color': fillColor,
            // The hovered admin area darkens and draws its outline in its own colour.
            'fill-opacity': ['case', isHovered, mapFillHoverOpacity, mapFillOpacity],
            'fill-outline-color': ['case', isHovered, fillColor, mapOutlineColor],
        },
    };
}

export default getAdminAreaFillLayer;
