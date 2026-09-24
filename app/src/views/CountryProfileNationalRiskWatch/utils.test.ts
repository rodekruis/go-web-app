import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    type AdminLevel,
    type CountryCodeIso3,
    type NrwEvent,
    type PlaceCode,
} from './types';
import {
    getAdminAreasQuery,
    getEventCountries,
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

    test('simplifies finer admin levels less', () => {
        expect(getAdminAreasQuery(countries, 0 as AdminLevel).transform).toBe('simplify,0.5');
        expect(getAdminAreasQuery(countries, 2 as AdminLevel).transform).toBe('simplify,0.001');
        expect(getAdminAreasQuery(countries, 5 as AdminLevel).transform).toBe('simplify,0.0005');
    });
});

describe('maxQueryableAdminLevel', () => {
    test('is one deeper than the last parent place code level', () => {
        expect(maxQueryableAdminLevel).toBe(5);
    });

    test('has no parent filter beyond the last parent place code level', () => {
        const countries = ['SSD' as CountryCodeIso3];
        const query = getAdminAreasQuery(countries, 9 as AdminLevel, 'SS03' as PlaceCode);

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
