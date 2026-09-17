import { type NrwLayerName } from '#views/CountryProfileNationalRiskWatch/types';

export const nrwLayerNames = {
    populationDensity: 'populationDensity',
    exposedPopulation: 'exposedPopulation',
    redCrossBranches: 'redCrossBranches',
    clinics: 'clinics',
    floodDepth: 'floodDepth',
    glofasStations: 'glofasStations',
    windSpeed: 'windSpeed',
} as const satisfies { [Name in NrwLayerName]: Name };

// Layers supported in the panel, in display order.
export const supportedLayerNames = [
    nrwLayerNames.floodDepth,
    nrwLayerNames.populationDensity,
] as const satisfies readonly NrwLayerName[];
