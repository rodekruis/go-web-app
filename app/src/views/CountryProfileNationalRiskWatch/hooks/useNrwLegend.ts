import {
    useContext,
    useMemo,
} from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import {
    floodDepthMapRamp,
    type NrwExposedPopulationScale,
} from '#utils/nrw/colors';
import supportedLayerNames from '#utils/nrw/layers';

import NrwEventsContext from '../contexts/NrwEventsContext';
import NrwAdminAreasContext from '../NrwAdminAreasProvider/NrwAdminAreasContext';
import {
    type NrwLayer,
    type NrwLayerName,
    type NrwLegend,
    type NrwLegendItem,
    type NrwLegendPlacement,
    NrwLegendState,
    NrwLegendType,
} from '../types';

const populationDensityGradient = [
    'var(--go-ui-color-gray-30)',
    'var(--go-ui-color-gray-40)',
    'var(--go-ui-color-gray-50)',
    'var(--go-ui-color-gray-60)',
    'var(--go-ui-color-gray-70)',
] as const;

interface NrwLegendContext {
    exposedPopulationScale: NrwExposedPopulationScale | undefined;
}

interface NrwLegendEntry {
    layerName: NrwLayerName;
    placement: NrwLegendPlacement;
    // Returns undefined when the layer has nothing to show in the legend.
    getItem: (layer: NrwLayer, context: NrwLegendContext) => NrwLegendItem | undefined;
}

// In display order within each placement.
const nrwLegendEntries: NrwLegendEntry[] = [
    {
        layerName: supportedLayerNames.floodDepth,
        placement: 'banner',
        getItem: (layer) => ({
            type: NrwLegendType.Gradient,
            layerName: layer.name,
            label: layer.label,
            colors: floodDepthMapRamp,
        }),
    },
    {
        layerName: supportedLayerNames.exposedPopulation,
        placement: 'banner',
        getItem: (layer, { exposedPopulationScale }) => {
            // No scale until the areas load, and none when nothing is exposed (flat fill).
            if (isNotDefined(exposedPopulationScale?.categories)) {
                return undefined;
            }

            return {
                type: NrwLegendType.Categories,
                layerName: layer.name,
                label: layer.label,
                categories: exposedPopulationScale.categories,
            };
        },
    },
    {
        layerName: supportedLayerNames.populationDensity,
        placement: 'panel',
        getItem: (layer) => ({
            type: NrwLegendType.Gradient,
            layerName: layer.name,
            label: layer.label,
            colors: populationDensityGradient,
        }),
    },
];

// The legend content of one placement, for the visible layers of the selected event.
function useNrwLegend(props: {
    placement: NrwLegendPlacement;
    availableLayers: NrwLayer[];
    visibleLayers: NrwLayerName[];
}): NrwLegend {
    const {
        placement,
        availableLayers,
        visibleLayers,
    } = props;

    const { selectedEvent } = useContext(NrwEventsContext);
    const { exposedPopulationScale } = useContext(NrwAdminAreasContext);

    return useMemo(
        (): NrwLegend => {
            if (isNotDefined(selectedEvent)) {
                return { state: NrwLegendState.NoEvent };
            }

            const visibleEntries = nrwLegendEntries.flatMap((entry) => {
                const layer = availableLayers.find(({ name }) => name === entry.layerName);

                if (
                    entry.placement !== placement
                    || isNotDefined(layer)
                    || !visibleLayers.includes(entry.layerName)
                ) {
                    return [];
                }

                return [{ entry, layer }];
            });

            if (visibleEntries.length === 0) {
                return { state: NrwLegendState.NoLayers };
            }

            return {
                state: NrwLegendState.Items,
                items: visibleEntries.flatMap(({ entry, layer }) => {
                    const item = entry.getItem(layer, { exposedPopulationScale });
                    return isDefined(item) ? [item] : [];
                }),
            };
        },
        [placement, selectedEvent, exposedPopulationScale, availableLayers, visibleLayers],
    );
}

export default useNrwLegend;
