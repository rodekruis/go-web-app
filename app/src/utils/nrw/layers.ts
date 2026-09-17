import { type NrwLayerName } from '#views/CountryProfileNationalRiskWatch/types';

// Layers the frontend supports, in layer panel display order.
const supportedLayerNames = {
    floodDepth: 'floodDepth',
    populationDensity: 'populationDensity',
    exposedPopulation: 'exposedPopulation',
    clinics: 'clinics',
} as const satisfies { [Name in NrwLayerName]?: Name };

export default supportedLayerNames;
