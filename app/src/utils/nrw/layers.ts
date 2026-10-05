import { type NrwLayerName } from '#views/CountryProfileNationalRiskWatch/types';

// Layers the frontend supports.
const supportedLayerNames = {
    exposedPopulation: 'exposedPopulation',
    floodDepth: 'floodDepth',
    clinics: 'clinics',
    populationDensity: 'populationDensity',
} as const satisfies { [Name in NrwLayerName]?: Name };

// TODO: consider moving this to NRW datamodel
export const layerDrawOrder: NrwLayerName[] = [
    supportedLayerNames.clinics,
    supportedLayerNames.floodDepth,
    supportedLayerNames.exposedPopulation,
    supportedLayerNames.populationDensity,
];

export function getLayerAnchorId(name: NrwLayerName): string {
    return `anchor-${name}`;
}

export default supportedLayerNames;
