import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    type CountryCodeIso3,
    type NrwEvent,
} from './types';
import { getEventCountries } from './utils';

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
