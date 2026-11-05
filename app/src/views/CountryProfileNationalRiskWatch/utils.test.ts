import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    type AdminLevel,
    type CountryCodeIso3,
    type NrwAdminAreaFeature,
    type NrwEvent,
    type PlaceCode,
} from './types';
import {
    getAdminAreaAnchor,
    getAdminAreasOfRequestsQuery,
    getAdminAreasQuery,
    getEventCountries,
    getUnsupportedCountryErrors,
    maxQueryableAdminLevel,
    parseAdminAreaProperties,
} from './utils';

function createEvent(countryCodeIso3: string): NrwEvent {
    return { countryCodeIso3 } as NrwEvent;
}

describe('getEventCountries', () => {
    test('returns nothing when there are no events', () => {
        expect(getEventCountries([])).toEqual([]);
    });

    test('returns the country of a single event', () => {
        expect(getEventCountries([createEvent('MWI')])).toEqual(['MWI']);
    });

    test('removes duplicate countries', () => {
        const events = [
            createEvent('MWI'),
            createEvent('KEN'),
            createEvent('MWI'),
        ];

        expect(getEventCountries(events)).toEqual(['KEN', 'MWI']);
    });

    test('sorts the countries so the order of the events does not matter', () => {
        const events = [
            createEvent('PHL'),
            createEvent('ETH'),
            createEvent('ZMB'),
        ];
        const reversedEvents = [...events].reverse();

        expect(getEventCountries(events)).toEqual(['ETH', 'PHL', 'ZMB']);
        expect(getEventCountries(reversedEvents)).toEqual(getEventCountries(events));
    });

    test('normalizes the case and the surrounding space of a country code', () => {
        expect(getEventCountries([createEvent(' mwi ')])).toEqual(['MWI']);
    });

    test('drops codes that are not ISO_A3', () => {
        const events = [
            createEvent('MW'),
            createEvent('MWII'),
            createEvent('M1I'),
            createEvent(''),
            createEvent('KEN'),
        ];

        expect(getEventCountries(events)).toEqual(['KEN']);
    });

    test('scoping to the derived countries matches passing them explicitly', () => {
        const events = [
            createEvent('PHL'),
            createEvent('ETH'),
            createEvent('PHL'),
        ];
        const explicitCountries = ['ETH', 'PHL'] as CountryCodeIso3[];

        expect(getEventCountries(events)).toEqual(explicitCountries);
    });
});

describe('getAdminAreasQuery', () => {
    const countries = ['SSD' as CountryCodeIso3];

    test('filters on the countries and admin level', () => {
        const query = getAdminAreasQuery(countries, 1 as AdminLevel);

        expect(query.filter).toBe("(countryCodeIso3='SSD') AND adminLevel=1");
    });

    test('filters on the parent place code one admin level up', () => {
        const query = getAdminAreasQuery(countries, 2 as AdminLevel, 'SS03' as PlaceCode);

        expect(query.filter).toBe("(countryCodeIso3='SSD') AND adminLevel=2 AND placeCodeLevel1='SS03'");
    });

    test('filters on the given place codes', () => {
        const placeCodes = ['SS03', 'SS05'] as PlaceCode[];
        const query = getAdminAreasQuery(countries, 1 as AdminLevel, undefined, placeCodes);

        expect(query.filter).toBe("(countryCodeIso3='SSD') AND adminLevel=1 AND placeCode IN ('SS03','SS05')");
    });

    test('simplifies admin level 0 only', () => {
        expect(getAdminAreasQuery(countries, 0 as AdminLevel).transform).toBe('simplify,0.05');
        expect(getAdminAreasQuery(countries, 1 as AdminLevel).transform).toBeUndefined();
    });
});

describe('getAdminAreasOfRequestsQuery', () => {
    test('fetches the admin areas of any of the requests, in the countries', () => {
        const query = getAdminAreasOfRequestsQuery(['SSD' as CountryCodeIso3], [
            {
                adminLevel: 1 as AdminLevel,
                parentPlaceCode: undefined,
                placeCodes: ['SS03', 'SS04'] as PlaceCode[],
            },
            {
                adminLevel: 2 as AdminLevel,
                parentPlaceCode: 'SS03' as PlaceCode,
                placeCodes: ['SS0301'] as PlaceCode[],
            },
        ]);

        expect(query.filter).toBe(
            "(countryCodeIso3='SSD') AND ((adminLevel=1 AND placeCode IN ('SS03','SS04'))"
            + " OR (adminLevel=2 AND placeCodeLevel1='SS03' AND placeCode IN ('SS0301')))",
        );
    });
});

describe('maxQueryableAdminLevel', () => {
    test('is one deeper than the last parent place code level', () => {
        expect(maxQueryableAdminLevel).toBe(5);
    });

    test('has no parent filter beyond the last parent place code level', () => {
        const countries = ['SSD' as CountryCodeIso3];
        const query = getAdminAreasQuery(countries, 9 as AdminLevel, 'SS03' as PlaceCode);

        // We remove the placecode if it is beyond the last parent place code level.
        expect(query.filter).toBe("(countryCodeIso3='SSD') AND adminLevel=9");
    });
});

describe('parseAdminAreaProperties', () => {
    test('reads the admin area', () => {
        const properties = {
            adminLevel: 2,
            placeCode: 'SS0303',
            nameEn: 'Bor South',
            attributes: { POPULATION: 135195 },
        };

        expect(parseAdminAreaProperties(properties)).toEqual({
            adminLevel: 2,
            placeCode: 'SS0303',
            name: 'Bor South',
        });
    });

    test('accepts the place code formats of different countries', () => {
        expect(parseAdminAreaProperties({ adminLevel: 1, placeCode: 'KEN.8_1', nameEn: 'HomaBay' })?.placeCode).toBe('KEN.8_1');
        expect(parseAdminAreaProperties({ adminLevel: 1, placeCode: 'SS01', nameEn: 'x' })?.placeCode).toBe('SS01');
    });

    test('returns null for invalid properties', () => {
        expect(parseAdminAreaProperties(null)).toBeNull();
        expect(parseAdminAreaProperties({ adminLevel: '1', placeCode: 'SS01', nameEn: 'x' })).toBeNull();
        expect(parseAdminAreaProperties({ adminLevel: 1, placeCode: "SS01' OR 1=1", nameEn: 'x' })).toBeNull();
        expect(parseAdminAreaProperties({ adminLevel: 1, placeCode: '', nameEn: 'x' })).toBeNull();
    });
});

describe('getAdminAreaAnchor', () => {
    // The generated DTO types the coordinates loosely, so the geometry is built untyped.
    function createFeature(geometry: unknown): NrwAdminAreaFeature {
        return {
            type: 'Feature',
            geometry,
            properties: { adminLevel: 1, placeCode: 'SS01', nameEn: 'x' },
        } as unknown as NrwAdminAreaFeature;
    }

    test('anchors a convex area at its centre', () => {
        const square = createFeature({
            type: 'Polygon',
            coordinates: [[[30, 6], [32, 6], [32, 8], [30, 8], [30, 6]]],
        });

        const anchor = getAdminAreaAnchor(square);

        expect(anchor?.lng).toBeCloseTo(31);
        expect(anchor?.lat).toBeCloseTo(7);
    });

    test('keeps the anchor on a concave area whose bounding box centre lies outside it', () => {
        // A U shape; its bounding box centre (31, 7) is in the gap.
        const uShape = createFeature({
            type: 'Polygon',
            coordinates: [[
                [30, 6], [32, 6], [32, 8], [31.5, 8], [31.5, 6.5],
                [30.5, 6.5], [30.5, 8], [30, 8], [30, 6],
            ]],
        });

        const anchor = getAdminAreaAnchor(uShape);

        expect(anchor).toBeDefined();
        expect(anchor?.lat).toBeLessThanOrEqual(6.5);
    });

    test('has no anchor for a feature without geometry', () => {
        expect(getAdminAreaAnchor(createFeature(null))).toBeUndefined();
    });
});

describe('getUnsupportedCountryErrors', () => {
    const supportedCountries = ['MWI', 'KEN', 'PHL'] as CountryCodeIso3[];

    describe('standalone mode', () => {
        test('shows nothing while the supported countries are pending', () => {
            // Act
            const result = getUnsupportedCountryErrors({
                standalone: true,
                supportedCountries: undefined,
                urlCountries: undefined,
                rawCountriesFromUrlParams: ['XXX'],
            });

            // Assert
            expect(result).toEqual({
                showUnsupportedCountriesNotice: false,
                showUnsupportedCountriesFullpageError: false,
            });
        });

        test('shows nothing when there are no countries', () => {
            // Act
            const result = getUnsupportedCountryErrors({
                standalone: true,
                supportedCountries,
                urlCountries: undefined,
                rawCountriesFromUrlParams: [],
            });

            // Assert
            expect(result).toEqual({
                showUnsupportedCountriesNotice: false,
                showUnsupportedCountriesFullpageError: false,
            });
        });

        test('shows the fullpage error for a single invalid country in the URL', () => {
            // Act
            const result = getUnsupportedCountryErrors({
                standalone: true,
                supportedCountries,
                urlCountries: undefined,
                rawCountriesFromUrlParams: ['XXX'],
            });

            // Assert
            expect(result).toEqual({
                showUnsupportedCountriesNotice: false,
                showUnsupportedCountriesFullpageError: true,
            });
        });

        test('shows nothing for a single supported country in the URL', () => {
            // Act
            const result = getUnsupportedCountryErrors({
                standalone: true,
                supportedCountries,
                urlCountries: ['MWI' as CountryCodeIso3],
                rawCountriesFromUrlParams: ['MWI'],
            });

            // Assert
            expect(result).toEqual({
                showUnsupportedCountriesNotice: false,
                showUnsupportedCountriesFullpageError: false,
            });
        });

        test('shows the notice for multiple URL countries with an invalid one', () => {
            // Act
            const result = getUnsupportedCountryErrors({
                standalone: true,
                supportedCountries,
                urlCountries: ['MWI', 'KEN'] as CountryCodeIso3[],
                rawCountriesFromUrlParams: ['MWI', 'KEN', 'XXX'],
            });

            // Assert
            expect(result).toEqual({
                showUnsupportedCountriesNotice: true,
                showUnsupportedCountriesFullpageError: false,
            });
        });

        test('shows the notice when all of multiple URL countries are invalid', () => {
            // Act
            const result = getUnsupportedCountryErrors({
                standalone: true,
                supportedCountries,
                urlCountries: undefined,
                rawCountriesFromUrlParams: ['XXX', 'YYY'],
            });

            // Assert
            expect(result).toEqual({
                showUnsupportedCountriesNotice: true,
                showUnsupportedCountriesFullpageError: false,
            });
        });

        test('shows nothing for multiple supported URL countries', () => {
            // Act
            const result = getUnsupportedCountryErrors({
                standalone: true,
                supportedCountries,
                urlCountries: ['MWI', 'KEN'] as CountryCodeIso3[],
                rawCountriesFromUrlParams: ['MWI', 'KEN'],
            });

            // Assert
            expect(result).toEqual({
                showUnsupportedCountriesNotice: false,
                showUnsupportedCountriesFullpageError: false,
            });
        });
    });

    describe('embedded mode', () => {
        test('shows nothing while the supported countries are pending', () => {
            // Act
            const result = getUnsupportedCountryErrors({
                standalone: false,
                supportedCountries: undefined,
                urlCountries: undefined,
                rawCountriesFromUrlParams: ['XXX'],
            });

            // Assert
            expect(result).toEqual({
                showUnsupportedCountriesNotice: false,
                showUnsupportedCountriesFullpageError: false,
            });
        });
        test('shows the fullpage error for an unsupported routing country', () => {
            // Act
            const result = getUnsupportedCountryErrors({
                standalone: false,
                supportedCountries,
                urlCountries: ['XXX' as CountryCodeIso3],
                rawCountriesFromUrlParams: [],
            });

            // Assert
            expect(result).toEqual({
                showUnsupportedCountriesNotice: false,
                showUnsupportedCountriesFullpageError: true,
            });
        });

        test('shows nothing for a supported routing country', () => {
            // Act
            const result = getUnsupportedCountryErrors({
                standalone: false,
                supportedCountries,
                urlCountries: ['MWI' as CountryCodeIso3],
                rawCountriesFromUrlParams: [],
            });

            // Assert
            expect(result).toEqual({
                showUnsupportedCountriesNotice: false,
                showUnsupportedCountriesFullpageError: false,
            });
        });
    });
});
