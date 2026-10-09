import { type NrwLayer } from '#views/CountryProfileNationalRiskWatch/types';

let nextId = 1;

// Builds a layer as the api returns it, for tests.
function createNrwLayer(name: NrwLayer['name'], label: string): NrwLayer {
    const id = nextId;
    nextId += 1;

    return {
        id,
        name,
        label,
        type: 'raster',
        description: undefined,
        hazardType: undefined,
    };
}

export default createNrwLayer;
