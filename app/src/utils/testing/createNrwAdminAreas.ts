import {
    type NrwAdminAreaFeatureCollection,
    type NrwAdminAreaProperties,
} from '#views/CountryProfileNationalRiskWatch/types';

// Builds the /admin-areas feature collection, without geometry, for tests.
function createNrwAdminAreas(placeCodes: string[]): NrwAdminAreaFeatureCollection {
    return {
        type: 'FeatureCollection',
        features: placeCodes.map((placeCode, index): NrwAdminAreaFeatureCollection['features'][number] => {
            const properties: NrwAdminAreaProperties = {
                id: index + 1,
                adminLevel: 1,
                attributes: { POPULATION: undefined },
                countryCodeIso3: placeCode.slice(0, 3),
                created: '2026-01-01',
                updated: '2026-01-01',
                nameEn: placeCode,
                placeCode,
                placeCodeLevel0: placeCode.slice(0, 2),
                placeCodeLevel1: placeCode,
                placeCodeLevel2: null,
                placeCodeLevel3: null,
                placeCodeLevel4: null,
            };

            return {
                type: 'Feature',
                id: undefined,
                geometry: null,
                properties,
            };
        }),
    };
}

export default createNrwAdminAreas;
