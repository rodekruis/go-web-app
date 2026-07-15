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
import type {
    EventResponseDto,
    ExposedAdminAreaDto,
} from './shared-dtos';
import { LayerName } from './shared-enums';

// Exposure values for a single admin level, used to color that level's areas.
// Get the exposed population value for a single exposed admin area
const getExposedPopulation = (area: ExposedAdminAreaDto): number => {
    const populationLayer = area.exposure.find(
        (layer) => layer.layerName === LayerName.populationExposed,
    );
    return populationLayer?.exposed ?? 0;
};

// Compute the exposure color for every exposed admin area, keyed by place code.
// Each area is colored relative to the most exposed area within its own admin level.
// Note: how the color is calculated may change with the final design.
const getExposureColorByPlaceCode = (
    exposedAdminAreas: Record<string, ExposedAdminAreaDto[]>,
    alertClass: EventResponseDto['alertClass'],
): Record<string, string> => {
    const exposureColorByPlaceCode: Record<string, string> = {};

    Object.values(exposedAdminAreas).forEach((exposedAreas) => {
        // Find the highest exposed population within this admin level
        const highestExposedPopulation = Math.max(
            0,
            ...exposedAreas.map(getExposedPopulation),
        );

        // Get the color for each area, scaled against the level's highest value
        exposedAreas.forEach((area) => {
            exposureColorByPlaceCode[area.placeCode] = getExposureColor(
                getExposedPopulation(area),
                highestExposedPopulation,
                alertClass,
            );
        });
    });

    return exposureColorByPlaceCode;
};

// Add the exposure color to each admin area as a feature property.
// Each feature is colored relative to the other areas in its own admin level.
// Mapbox needs the color to be a property of the vector data if colors differ
// among objects of the same layer.
const setExposureColorsOnFeatures = (
    features: GeoJSON.Feature[],
    selectedEvent: EventResponseDto,
): GeoJSON.Feature[] => {
    const {
        eventId,
        alertClass,
        exposedAdminAreas,
    } = selectedEvent;

    if (Object.keys(exposedAdminAreas).length === 0) {
        throw new Error(`Event ${eventId} has no exposure data`);
    }

    // Get exposure colors for all exposed admin areas, keyed by place code.
    const exposureColorByPlaceCode = getExposureColorByPlaceCode(
        exposedAdminAreas,
        alertClass,
    );

    // Set the exposure color property for each feature
    return features.map((feature) => {
        const placeCode = feature.properties?.[PLACE_CODE_FIELD_KEY];
        const exposureColor = typeof placeCode === 'string'
            ? exposureColorByPlaceCode[placeCode]
            : undefined;

        if (exposureColor === undefined) {
            // This would only be expected to be hit if the data is malformed.
            console.error(`[setExposureColorsOnFeatures] No exposure color for feature with place code ${placeCode}`);
            return feature;
        }

        return {
            ...feature,
            properties: {
                ...feature.properties,
                [EXPOSURE_COLOR_FIELD_KEY]: exposureColor,
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
