import {
    describe,
    expect,
    test,
} from 'vitest';

import supportedLayerNames from '#utils/nrw/layers';
import {
    type AdminLevel,
    type NrwEvent,
    type NrwExposedAdminArea,
} from '#views/CountryProfileNationalRiskWatch/types';

import {
    getNrwExposedAdminLevels,
    getNrwExposedPlaceCodes,
    getNrwExposedPopulation,
    getNrwExposedPopulationByPlaceCode,
    getNrwInitialAdminLevel,
} from './events';

function createEvent(exposedAdminAreas: NrwEvent['exposedAdminAreas']): NrwEvent {
    return { exposedAdminAreas } as NrwEvent;
}

function createArea(placeCode: string, name: string, exposed: number): NrwExposedAdminArea {
    return {
        placeCode,
        name,
        adminLevel: placeCode.length - 2,
        exposure: [{ layerName: supportedLayerNames.exposedPopulation, total: null, exposed }],
    };
}

describe('getNrwExposedPopulation', () => {
    test('reads the exposed population layer', () => {
        expect(getNrwExposedPopulation(createArea('MW1', 'Northern', 12000))).toBe(12000);
    });

    test('is unknown without an exposed population layer', () => {
        const area: NrwExposedAdminArea = {
            placeCode: 'MW1',
            name: 'Northern',
            adminLevel: 1,
            exposure: [{ layerName: supportedLayerNames.clinics, total: null, exposed: 7 }],
        };

        expect(getNrwExposedPopulation(area)).toBeUndefined();
    });
});

describe('getNrwExposedPopulationByPlaceCode', () => {
    test('maps the place codes of every admin level to their exposed population', () => {
        const event = createEvent({
            0: [createArea('ET', 'Ethiopia', 61800)],
            1: [createArea('ET02', 'Afar', 40000)],
            2: [createArea('ET0201', 'Awsi Rasu', 30000), createArea('ET0202', 'Kilbet Rasu', 10000)],
        });

        expect(getNrwExposedPopulationByPlaceCode(event)).toEqual(new Map([
            ['ET', 61800],
            ['ET02', 40000],
            ['ET0201', 30000],
            ['ET0202', 10000],
        ]));
    });

    test('skips areas without an exposed population layer', () => {
        const area: NrwExposedAdminArea = {
            placeCode: 'ET02', name: 'Afar', adminLevel: 1, exposure: [],
        };

        expect(getNrwExposedPopulationByPlaceCode(createEvent({ 1: [area] }))).toEqual(new Map());
    });
});

describe('getNrwExposedAdminLevels', () => {
    test('lists the sub-national admin levels with exposed areas, least granular first', () => {
        const event = createEvent({
            2: [createArea('ET0201', 'Awsi Rasu', 30000)],
            0: [createArea('ET', 'Ethiopia', 61800)],
            1: [createArea('ET02', 'Afar', 40000)],
            3: [],
        });

        expect(getNrwExposedAdminLevels(event)).toEqual([1, 2]);
    });
});

describe('getNrwInitialAdminLevel', () => {
    test('opens at the least granular level with more than one exposed area', () => {
        const event = createEvent({
            0: [createArea('SS', 'South Sudan', 300000)],
            1: [createArea('SS03', 'Jonglei', 250000), createArea('SS04', 'Unity', 50000)],
            2: [createArea('SS0301', 'Akobo', 250000), createArea('SS0401', 'Abiemnhom', 50000)],
        });

        expect(getNrwInitialAdminLevel(event)).toBe(1);
    });

    test('skips the levels with a single exposed area', () => {
        const event = createEvent({
            1: [createArea('MW2', 'Central', 640000)],
            2: [createArea('MW202', 'Rumphi', 640000)],
            3: [createArea('MW20201', 'Chikulamayembe', 430000), createArea('MW20202', 'Mzenga', 210000)],
        });

        expect(getNrwInitialAdminLevel(event)).toBe(3);
    });

    test('opens a single chain of exposed areas at its most granular level', () => {
        const event = createEvent({
            1: [createArea('MW2', 'Central', 21000)],
            2: [createArea('MW202', 'Rumphi', 21000)],
            3: [createArea('MW20201', 'Mzimba', 21000)],
        });

        expect(getNrwInitialAdminLevel(event)).toBe(3);
    });

    test('opens one level below the country without exposed sub-national areas', () => {
        expect(getNrwInitialAdminLevel(createEvent({}))).toBe(1);
        expect(getNrwInitialAdminLevel(createEvent({ 0: [createArea('MW', 'Malawi', 1)] }))).toBe(1);
    });
});

describe('getNrwExposedPlaceCodes', () => {
    test('reads the valid place codes of the given admin level', () => {
        const event = createEvent({
            1: [createArea('ET02', 'Afar', 40000), createArea("ET'; DROP", 'Bad', 1)],
        });

        expect(getNrwExposedPlaceCodes(event, 1 as AdminLevel)).toEqual(['ET02']);
        expect(getNrwExposedPlaceCodes(event, 2 as AdminLevel)).toEqual([]);
    });
});
