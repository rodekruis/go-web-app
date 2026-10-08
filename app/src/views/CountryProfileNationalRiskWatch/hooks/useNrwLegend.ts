import { useMemo } from 'react';

import supportedLayerNames from '#utils/nrw/layers';

import {
    type NrwLayer,
    type NrwLayerName,
    type NrwLegendItem,
    NrwLegendType,
} from '../types';

const populationDensityGradient = [
    'var(--go-ui-color-gray-30)',
    'var(--go-ui-color-gray-40)',
    'var(--go-ui-color-gray-50)',
    'var(--go-ui-color-gray-60)',
    'var(--go-ui-color-gray-70)',
] as const;

interface NrwLegendConfig {
    getItem: (layer: NrwLayer) => NrwLegendItem;
}

const nrwLegendItemsConfig: Partial<Record<NrwLayerName, NrwLegendConfig>> = {
    [supportedLayerNames.populationDensity]: {
        getItem: (layer) => ({
            type: NrwLegendType.Gradient,
            layerName: layer.name,
            label: layer.label,
            colors: populationDensityGradient,
        }),
    },
};

// Legend content management for both the map panel and the footer
function useNrwLegend(props: {
    availableLayers: NrwLayer[] | undefined;
    visibleLayers: NrwLayerName[];
    enabled: boolean;
}) {
    const { availableLayers, visibleLayers, enabled } = props;

    const legendItems = useMemo(
        (): NrwLegendItem[] => {
            if (!enabled) {
                return [];
            }

            return Object.values(supportedLayerNames).flatMap((name) => {
                const config = nrwLegendItemsConfig[name];
                const layer = availableLayers?.find(
                    (availableLayer) => availableLayer.name === name,
                );

                if (
                    config === undefined
                    || layer === undefined
                    || !visibleLayers.includes(name)
                ) {
                    return [];
                }

                return [config.getItem(layer)];
            });
        },
        [availableLayers, visibleLayers, enabled],
    );

    return { legendItems };
}

export default useNrwLegend;
