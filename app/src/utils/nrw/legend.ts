import {
    type NrwLayer,
    type NrwLayerName,
} from '#views/CountryProfileNationalRiskWatch/types';

import supportedLayerNames from './layers';

export enum NrwLegendType {
    Gradient = 'gradient',
}

export type NrwLegendItem = {
    type: NrwLegendType.Gradient;
    layerName: NrwLayerName;
    label: NrwLayer['label'];
    colors: readonly string[];
};

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

export function getNrwLegendItems(
    availableLayers: NrwLayer[] | undefined,
    visibleLayers: NrwLayerName[],
): NrwLegendItem[] {
    return Object.values(supportedLayerNames).flatMap((name) => {
        const config = nrwLegendItemsConfig[name];
        const layer = availableLayers?.find((availableLayer) => availableLayer.name === name);

        if (
            config === undefined
            || layer === undefined
            || !visibleLayers.includes(name)
        ) {
            return [];
        }

        return [config.getItem(layer)];
    });
}
