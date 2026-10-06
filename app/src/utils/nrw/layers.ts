import { type NrwLayerName } from '#views/CountryProfileNationalRiskWatch/types';

// Layers the frontend supports.
const supportedLayerNames = [
    'exposedPopulation',
    'floodDepth',
    'clinics',
    'populationDensity',
] as const satisfies readonly NrwLayerName[];
export type SupportedLayerName = (typeof supportedLayerNames)[number];

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
