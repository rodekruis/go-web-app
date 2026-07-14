import { type Map as MapboxGLMap } from 'mapbox-gl-v3';

import {
    EXPOSURE_COLOR_FIELD_KEY,
    PLACE_CODE_FIELD_KEY,
} from './nrwConstants';
import { fetchExposedAdminAreasFeatures } from './nrwDataFetchHelpers';
import {
    addOrderedLayer,
    animationDurationMs,
    exposedAreasDrawOrder,
    makeExposedAreasFillLayerFromFeatures,
} from './nrwMapHelpers';
import { getExposureColor } from './nrwMapStyles';
import type { OrderedMapLayer } from './nrwMapTypes';
import {
    getBoundsFromFeatures,
    getZoomToFitBounds,
} from './nrwMapViewHelpers';
import type { EventResponseDto } from './shared-dtos';
import { LayerName } from './shared-enums';

// Add the exposure color to each admin area as a feature property.
// Mapbox needs the color to be a property of the vector data if colors differ
// among objects of the same layer.
export const setExposureColorsOnFeatures = (
    features: GeoJSON.Feature[],
    selectedEvent: EventResponseDto,
): GeoJSON.Feature[] => {
    const {
        eventId,
        alertClass,
        exposedAdminAreas,
    } = selectedEvent;

    // Find the deepest (lowest) admin level that has exposed areas.
    // Note: this is prototype behavior and we'd need colors for each level
    // depending on the final design.
    const deepestExposedLevel = Object.keys(exposedAdminAreas).at(-1);
    const deepestExposedAreas = deepestExposedLevel !== undefined
        ? exposedAdminAreas[deepestExposedLevel]
        : undefined;
    if (deepestExposedAreas === undefined) {
        throw new Error(`Event ${eventId} has no exposed population data`);
    }

    // Get the exposed population per place code, and the highest value, for the level
    const exposedPopulationByPlaceCode: Record<string, number> = {};
    let highestExposedPopulation = 0;
    deepestExposedAreas.forEach((area) => {
        const populationLayer = area.exposure.find(
            (layer) => layer.layerName === LayerName.populationExposed,
        );
        const exposedPopulation = populationLayer?.exposed ?? 0;
        exposedPopulationByPlaceCode[area.placeCode] = exposedPopulation;
        if (exposedPopulation > highestExposedPopulation) {
            highestExposedPopulation = exposedPopulation;
        }
    });

    // Set the exposure color property for each feature
    return features.map((feature) => {
        const placeCode = feature.properties?.[PLACE_CODE_FIELD_KEY];
        const exposedPopulation = typeof placeCode === 'string'
            ? exposedPopulationByPlaceCode[placeCode] ?? 0
            : 0;
        return {
            ...feature,
            properties: {
                ...feature.properties,
                [EXPOSURE_COLOR_FIELD_KEY]: getExposureColor(
                    exposedPopulation,
                    highestExposedPopulation,
                    alertClass,
                ),
            },
        };
    });
};

// Check if the selected event has any exposed population data
function hasExposedPopulationData(selectedEvent: EventResponseDto): boolean {
    const { exposedAdminAreas } = selectedEvent;
    return Object.keys(exposedAdminAreas).length > 0;
}

// Fetch, prepare, render, and zoom to a selected event's exposed admin areas.
// Returns null when the caller marks this render request as
// outdated, or when the data cannot be fetched or rendered.
export default async function renderExposedAreasOnMap({
    map,
    scopedCountries,
    selectedEvent,
    orderedLayers,
    isOutdated,
}: {
    map: MapboxGLMap;
    scopedCountries: string[];
    selectedEvent: EventResponseDto;
    orderedLayers: OrderedMapLayer[];
    isOutdated?: () => boolean;
}): Promise<
{
    layer: ReturnType<typeof makeExposedAreasFillLayerFromFeatures>;
    orderedLayers: OrderedMapLayer[];
} | null
> {
    if (!hasExposedPopulationData(selectedEvent)) {
        console.error(`[renderSelectedEventExposedAreasOnMap] No exposed population data for event ${selectedEvent.eventId}`);
        return null;
    }

    try {
        const features = await fetchExposedAdminAreasFeatures(
            scopedCountries,
            selectedEvent,
        );
        if (isOutdated?.()) {
            return null;
        }

        const coloredFeatures = setExposureColorsOnFeatures(features, selectedEvent);
        const layer = makeExposedAreasFillLayerFromFeatures(
            `exposed-areas-event-${selectedEvent.eventId}`,
            coloredFeatures,
        );

        // Insert below all other data layers so exposed areas render at the bottom.
        const updatedOrderedLayers = addOrderedLayer(
            map,
            layer,
            exposedAreasDrawOrder,
            orderedLayers,
        );

        // Zoom to fit the exposed admin area bounds
        const exposedAreasBounds = getBoundsFromFeatures(features);
        if (exposedAreasBounds) {
            map.fitBounds(getZoomToFitBounds(exposedAreasBounds), {
                duration: animationDurationMs,
            });
        }

        return {
            layer,
            orderedLayers: updatedOrderedLayers,
        };
    } catch (error) {
        console.error(`[renderSelectedEventExposedAreasOnMap] Failed to render exposed areas for event ${selectedEvent.eventId}:`, error);
        return null;
    }
}
