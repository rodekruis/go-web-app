import { type NrwLayerName } from '#views/CountryProfileNationalRiskWatch/types';

// Layers the frontend supports, in layer panel display order.
const supportedLayerNames = {
    exposedPopulation: 'exposedPopulation',
    floodDepth: 'floodDepth',
    clinics: 'clinics',
    populationDensity: 'populationDensity',
} as const satisfies { [Name in NrwLayerName]?: Name };

// Bottom to top.
// TODO: consider moving this to NRW datamodel
export const layerDrawOrder: NrwLayerName[] = [
    supportedLayerNames.populationDensity,
    supportedLayerNames.exposedPopulation,
    supportedLayerNames.floodDepth,
    supportedLayerNames.clinics,
];

export function getLayerAnchorId(name: NrwLayerName): string {
    return `anchor-${name}`;
}

export default supportedLayerNames;
