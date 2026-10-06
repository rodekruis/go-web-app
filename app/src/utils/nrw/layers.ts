import { type NrwLayerName } from '#views/CountryProfileNationalRiskWatch/types';

// Layers the frontend supports.
const supportedLayerNames = {
    exposedPopulation: 'exposedPopulation',
    floodDepth: 'floodDepth',
    clinics: 'clinics',
    populationDensity: 'populationDensity',
} as const satisfies { [Name in NrwLayerName]?: Name };

type SupportedLayerName = (typeof supportedLayerNames)[keyof typeof supportedLayerNames];

export function getLayerOrder(
    positions: Record<SupportedLayerName, number>,
): NrwLayerName[] {
    return Object.values(supportedLayerNames)
        .toSorted((a, b) => positions[a] - positions[b]);
}

// TODO: consider moving this to NRW datamodel
export const layerDrawOrder = getLayerOrder({
    clinics: 0,
    floodDepth: 1,
    exposedPopulation: 2,
    populationDensity: 3,
});

export function getLayerAnchorId(name: NrwLayerName): string {
    return `anchor-${name}`;
}

export default supportedLayerNames;
