import {
    describe,
    expect,
    test,
} from 'vitest';

import supportedLayerNames from '#utils/nrw/layers';
import {
    type AdminLevel,
    type NrwAdminAreaProperties,
    type NrwEvent,
    type NrwExposedAdminArea,
    type NrwForecastSource,
    type PlaceCode,
} from '#views/CountryProfileNationalRiskWatch/types';

import {
    formatNrwEventDate,
    getExposedAdminArea,
    getNrwDrillPath,
    getNrwExposedAdminLevels,
    getNrwExposedPlaceCodes,
    getNrwExposedPopulation,
    getNrwExposedPopulationByPlaceCode,
    getNrwInitialAdminLevel,
    getNrwSortedForecastSources,
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

function createForecastSource(name: NrwForecastSource['name']): NrwForecastSource {
    return {
        name,
        title: name,
        dataset: name,
        provider: name,
        lastUpdated: name,
        description: name,
        moreInfoLabel: name,
        moreInfoUrl: name,
    };
}

function getForecastSourceNames(forecastSources: NrwForecastSource[]): NrwForecastSource['name'][] {
    return forecastSources.map(({ name }) => name);
}

describe('formatNrwEventDate', () => {
    test('writes the month as a word so the day and the month cannot be swapped', () => {
        // Arrange: a local date keeps the day stable in every time zone
        const startAt = new Date(2026, 3, 3, 12).toISOString();

        // Act & Assert
        expect(formatNrwEventDate(startAt)).toBe('03 Apr 2026');
    });

    test('is empty for a value that is not a date', () => {
        expect(formatNrwEventDate('unknown')).toBe('');
    });
});

describe('getNrwSortedForecastSources', () => {
    test('puts river discharge first, then flood hazard maps, then population', () => {
        const event = {
            forecastSources: [
                createForecastSource('worldpop'),
                createForecastSource('glofasFloodHazardMaps'),
                createForecastSource('glofasRiverDischarge'),
            ],
        } as NrwEvent;

        expect(getForecastSourceNames(getNrwSortedForecastSources(event))).toEqual([
            'glofasRiverDischarge',
            'glofasFloodHazardMaps',
            'worldpop',
        ]);
    });

    test('puts unordered sources last, keeping their backend order', () => {
        const event = {
            forecastSources: [
                createForecastSource('ecmwfTropicalCyclone'),
                createForecastSource('worldpop'),
                createForecastSource('gefsTropicalCyclone'),
                createForecastSource('glofasRiverDischarge'),
            ],
        } as NrwEvent;

        expect(getForecastSourceNames(getNrwSortedForecastSources(event))).toEqual([
            'glofasRiverDischarge',
            'worldpop',
            'ecmwfTropicalCyclone',
            'gefsTropicalCyclone',
        ]);
    });

    test('does not mutate the event', () => {
        const forecastSources = [
            createForecastSource('worldpop'),
            createForecastSource('glofasRiverDischarge'),
        ];
        const event = { forecastSources } as NrwEvent;

        getNrwSortedForecastSources(event);

        expect(getForecastSourceNames(event.forecastSources)).toEqual([
            'worldpop',
            'glofasRiverDischarge',
        ]);
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

describe('getExposedAdminArea', () => {
    // Opens at level 1: Jonglei and Unity split the exposure.
    const event = createEvent({
        0: [createArea('SS', 'South Sudan', 300000)],
        1: [createArea('SS03', 'Jonglei', 250000), createArea('SS04', 'Unity', 50000)],
        2: [createArea('SS0303', 'Bor South', 250000), createArea('SS0401', 'Abiemnhom', 50000)],
        3: [createArea('SS030301', 'Anyidi', 250000)],
    });

    test('names the exposed admin area with the given place code at its admin level', () => {
        // Act & Assert
        expect(getExposedAdminArea(event, 'SS0303' as PlaceCode)).toEqual({
            adminLevel: 2,
            placeCode: 'SS0303',
            name: 'Bor South',
        });
    });

    test('is unknown for an admin area that is not exposed', () => {
        // Act & Assert
        expect(getExposedAdminArea(event, 'SS05' as PlaceCode)).toBeUndefined();
    });

    test('is known above the initial admin level and at the deepest exposed level', () => {
        // Act & Assert
        expect(getExposedAdminArea(event, 'SS' as PlaceCode)?.name).toBe('South Sudan');
        expect(getExposedAdminArea(event, 'SS030301' as PlaceCode)?.name).toBe('Anyidi');
    });
});

describe('getNrwDrillPath', () => {
    const event = createEvent({
        1: [createArea('SS03', 'Jonglei', 250000), createArea('SS04', 'Unity', 50000)],
        2: [createArea('SS0303', 'Bor South', 250000)],
    });

    function createAdminArea(adminLevel: number, parents: Record<string, string | null>) {
        return {
            adminLevel,
            placeCode: 'SS030301',
            placeCodeLevel0: 'SS',
            placeCodeLevel1: null,
            placeCodeLevel2: null,
            placeCodeLevel3: null,
            placeCodeLevel4: null,
            ...parents,
        } as NrwAdminAreaProperties;
    }

    test('lists the parents from the initial admin level down, named by the event', () => {
        // Arrange
        const adminArea = createAdminArea(3, {
            placeCodeLevel1: 'SS03',
            placeCodeLevel2: 'SS0303',
            placeCodeLevel3: 'SS030301',
        });

        // Act & Assert
        expect(getNrwDrillPath(event, 1 as AdminLevel, adminArea)).toEqual([
            { adminLevel: 1, placeCode: 'SS03', name: 'Jonglei' },
            { adminLevel: 2, placeCode: 'SS0303', name: 'Bor South' },
        ]);
    });

    test('is empty at the initial admin level', () => {
        // Arrange
        const adminArea = createAdminArea(1, { placeCodeLevel1: 'SS03' });

        // Act & Assert
        expect(getNrwDrillPath(event, 1 as AdminLevel, adminArea)).toEqual([]);
    });

    test('falls back to the place code of a parent the event does not expose', () => {
        // Arrange
        const adminArea = createAdminArea(3, {
            placeCodeLevel1: 'SS04',
            placeCodeLevel2: 'SS0401',
            placeCodeLevel3: 'SS040101',
        });

        // Act & Assert
        expect(getNrwDrillPath(event, 2 as AdminLevel, adminArea)).toEqual([
            { adminLevel: 2, placeCode: 'SS0401', name: 'SS0401' },
        ]);
    });

    test('skips a parent place code that is not safe for the admin areas filter', () => {
        // Arrange
        const adminArea = createAdminArea(2, { placeCodeLevel1: "SS03'" });

        // Act & Assert
        expect(getNrwDrillPath(event, 1 as AdminLevel, adminArea)).toEqual([]);
    });
});
