import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    type NrwEvent,
    type NrwExposedAdminArea,
} from '#views/CountryProfileNationalRiskWatch/types';

import {
    getNrwExposedAreas,
    getNrwExposedPopulation,
    getNrwTotalExposedPopulation,
} from './events';

function createEvent(exposedAdminAreas: NrwEvent['exposedAdminAreas']): NrwEvent {
    return { exposedAdminAreas } as NrwEvent;
}

function createArea(placeCode: string, name: string, exposed: number): NrwExposedAdminArea {
    return {
        placeCode,
        name,
        adminLevel: placeCode.length - 2,
        exposure: [{ layerName: 'populationExposed', total: null, exposed }],
    };
}

describe('getNrwExposedAreas', () => {
    test('reads the least granular sub-national admin level', () => {
        const event = createEvent({
            0: [createArea('ET', 'Ethiopia', 61800)],
            1: [createArea('ET02', 'Afar', 40000)],
            2: [createArea('ET0201', 'Awsi Rasu', 30000)],
        });

        expect(getNrwExposedAreas(event)).toEqual([createArea('ET02', 'Afar', 40000)]);
    });

    test('orders the areas by exposed population, most exposed first', () => {
        const event = createEvent({
            2: [
                createArea('MW201', 'Nkhata Bay', 54000),
                createArea('MW202', 'Rumphi', 610000),
                createArea('MW203', 'Mzimba', 210000),
            ],
        });

        expect(getNrwExposedAreas(event).map((area) => area.name)).toEqual([
            'Rumphi',
            'Mzimba',
            'Nkhata Bay',
        ]);
    });

    test('returns no areas without a sub-national admin level', () => {
        expect(getNrwExposedAreas(createEvent({}))).toEqual([]);
        expect(getNrwExposedAreas(createEvent({ 0: [createArea('MW', 'Malawi', 1)] }))).toEqual([]);
    });
});

describe('getNrwExposedPopulation', () => {
    test('reads the exposed population layer', () => {
        expect(getNrwExposedPopulation(createArea('MW1', 'Northern', 12000))).toBe(12000);
    });

    test('is unknown without an exposed population layer', () => {
        const area: NrwExposedAdminArea = {
            placeCode: 'MW1',
            name: 'Northern',
            adminLevel: 1,
            exposure: [{ layerName: 'clinics', total: null, exposed: 7 }],
        };

        expect(getNrwExposedPopulation(area)).toBeUndefined();
    });
});

describe('getNrwTotalExposedPopulation', () => {
    test('adds up the exposed populations', () => {
        expect(getNrwTotalExposedPopulation([
            createArea('MW1', 'Rumphi', 610000),
            createArea('MW2', 'Karonga', 430000),
        ])).toBe(1040000);
        expect(getNrwTotalExposedPopulation([])).toBe(0);
    });
});
