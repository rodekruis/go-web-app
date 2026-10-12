import { useMemo } from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import {
    alertClassMapRamps,
    floodDepthMapRamp,
    getAdminAreaExposedPopulationBreaks,
} from '#utils/nrw/colors';
import { getNrwExposedPopulationByPlaceCode } from '#utils/nrw/events';
import supportedLayerNames from '#utils/nrw/layers';

import {
    type NrwAdminAreaFeatureCollection,
    type NrwEvent,
    type NrwLayer,
    type NrwLayerName,
    type NrwLegendBanner,
    NrwLegendBannerState,
    type NrwLegendItem,
    NrwLegendType,
} from '../types';

interface NrwLegendBannerContext {
    selectedEvent: NrwEvent;
    adminAreas: NrwAdminAreaFeatureCollection | undefined;
}

interface NrwLegendBannerConfig {
    layerName: NrwLayerName;
    // Returns undefined when the layer has nothing to show in the legend.
    getItem: (layer: NrwLayer, context: NrwLegendBannerContext) => NrwLegendItem | undefined;
}

// In display order.
const nrwLegendBannerConfigs: NrwLegendBannerConfig[] = [
    {
        layerName: supportedLayerNames.floodDepth,
        getItem: (layer) => ({
            type: NrwLegendType.Gradient,
            layerName: layer.name,
            label: layer.label,
            colors: floodDepthMapRamp,
        }),
    },
    {
        layerName: supportedLayerNames.exposedPopulation,
        getItem: (layer, { selectedEvent, adminAreas }) => {
            if (isNotDefined(adminAreas)) {
                return undefined;
            }

            const breaks = getAdminAreaExposedPopulationBreaks(
                adminAreas,
                getNrwExposedPopulationByPlaceCode(selectedEvent),
            );

            // The map draws a flat fill when nothing is exposed.
            if (breaks[0] <= 0) {
                return undefined;
            }

            const bounds = [undefined, ...breaks, undefined];

            return {
                type: NrwLegendType.Classes,
                layerName: layer.name,
                label: layer.label,
                classes: alertClassMapRamps[selectedEvent.alertClass].map((color, index) => ({
                    color,
                    from: bounds[index],
                    to: bounds[index + 1],
                })),
            };
        },
    },
];

// The content of the legend strip under the map.
function useNrwLegendBanner(props: {
    selectedEvent: NrwEvent | undefined;
    adminAreas: NrwAdminAreaFeatureCollection | undefined;
    availableLayers: NrwLayer[] | undefined;
    visibleLayers: NrwLayerName[];
}): NrwLegendBanner {
    const {
        selectedEvent,
        adminAreas,
        availableLayers,
        visibleLayers,
    } = props;

    return useMemo(
        (): NrwLegendBanner => {
            if (isNotDefined(selectedEvent)) {
                return { state: NrwLegendBannerState.Countries };
            }

            const visibleConfigs = nrwLegendBannerConfigs.flatMap((config) => {
                const layer = availableLayers?.find(({ name }) => name === config.layerName);

                if (isNotDefined(layer) || !visibleLayers.includes(config.layerName)) {
                    return [];
                }

                return [{ config, layer }];
            });

            if (visibleConfigs.length === 0) {
                return { state: NrwLegendBannerState.NoLayers };
            }

            return {
                state: NrwLegendBannerState.Event,
                items: visibleConfigs.flatMap(({ config, layer }) => {
                    const item = config.getItem(layer, { selectedEvent, adminAreas });
                    return isDefined(item) ? [item] : [];
                }),
            };
        },
        [selectedEvent, adminAreas, availableLayers, visibleLayers],
    );
}

export default useNrwLegendBanner;
