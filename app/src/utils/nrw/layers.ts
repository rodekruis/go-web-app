import { type NrwLayerName } from '#views/CountryProfileNationalRiskWatch/types';

// Layers the frontend supports.
const supportedLayerNames = {
    exposedPopulation: 'exposedPopulation',
    floodDepth: 'floodDepth',
    clinics: 'clinics',
    populationDensity: 'populationDensity',
} as const satisfies { [Name in NrwLayerName]?: Name };
export type SupportedLayerName = (typeof supportedLayerNames)[keyof typeof supportedLayerNames];

export const layerDrawOrder: SupportedLayerName[] = [
    'clinics',
    'floodDepth',
    'exposedPopulation',
    'populationDensity',
];

export function getLayerAnchorId(name: NrwLayerName): string {
    return `anchor-${name}`;
}

export default supportedLayerNames;
