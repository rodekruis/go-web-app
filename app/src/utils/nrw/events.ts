import { formatDate } from '@ifrc-go/ui/utils';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import supportedLayerNames from '#utils/nrw/layers';
import {
    type AdminAreaProperties,
    type AdminLevel,
    type NrwAdminAreaProperties,
    type NrwEvent,
    type NrwExposedAdminArea,
    type NrwForecastSource,
    type PlaceCode,
} from '#views/CountryProfileNationalRiskWatch/types';
import {
    maxQueryableAdminLevel,
    parsePlaceCode,
    placeCodeLevelKeys,
} from '#views/CountryProfileNationalRiskWatch/utils';

const forecastSourceOrder: NrwForecastSource['name'][] = [
    'glofasRiverDischarge',
    'glofasFloodHazardMaps',
    'worldpop',
];

// Shared by the event name and the event detail so the dates of one event always match
const eventDateFormat = 'dd MMM yyyy';

export function formatNrwEventDate(value: string): string {
    return formatDate(value, eventDateFormat) ?? '';
}

function getForecastSourceRank(forecastSource: NrwForecastSource): number {
    const rank = forecastSourceOrder.indexOf(forecastSource.name);
    return rank === -1 ? forecastSourceOrder.length : rank;
}

export function getNrwSortedForecastSources(event: NrwEvent): NrwForecastSource[] {
    return [...event.forecastSources].sort(
        (a, b) => getForecastSourceRank(a) - getForecastSourceRank(b),
    );
}

export function getNrwExposedPopulation(area: NrwExposedAdminArea): number | undefined {
    return area.exposure.find(
        ({ layerName }) => layerName === supportedLayerNames.exposedPopulation,
    )?.exposed;
}

// Exposed population of every exposed admin area of the event, at all admin levels.
export function getNrwExposedPopulationByPlaceCode(
    event: NrwEvent,
): Map<NrwExposedAdminArea['placeCode'], number> {
    return new Map(
        Object.values(event.exposedAdminAreas)
            .flat()
            .map((area) => [area.placeCode, getNrwExposedPopulation(area)] as const)
            .filter((entry): entry is readonly [string, number] => isDefined(entry[1])),
    );
}

function getExposedAdminAreas(event: NrwEvent, adminLevel: number): NrwExposedAdminArea[] {
    return event.exposedAdminAreas[String(adminLevel)] ?? [];
}

// The place codes of every exposed admin area of the event, at all admin levels.
export function getNrwAllExposedPlaceCodes(event: NrwEvent): Set<NrwExposedAdminArea['placeCode']> {
    return new Set(
        Object.values(event.exposedAdminAreas).flat().map(({ placeCode }) => placeCode),
    );
}

// The sub-national admin levels that have exposed admin areas, least granular first.
export function getNrwExposedAdminLevels(event: NrwEvent): AdminLevel[] {
    return Object.keys(event.exposedAdminAreas)
        .map(Number)
        .filter((adminLevel) => (
            adminLevel > 0 && getExposedAdminAreas(event, adminLevel).length > 0
        ))
        .sort((a, b) => a - b) as AdminLevel[];
}

// The admin level to open an event at.
export function getNrwInitialAdminLevel(event: NrwEvent): AdminLevel {
    const exposedAdminLevels = getNrwExposedAdminLevels(event);

    // The lowest exposed level with multiple areas.
    const splitAdminLevel = exposedAdminLevels.find(
        (adminLevel) => getExposedAdminAreas(event, adminLevel).length > 1,
    );

    const highestAdminLevel = exposedAdminLevels.at(-1);

    return splitAdminLevel ?? highestAdminLevel ?? (1 as AdminLevel);
}

// The valid place codes of the exposed admin areas at the given admin level.
export function getNrwExposedPlaceCodes(event: NrwEvent, adminLevel: AdminLevel): PlaceCode[] {
    return getExposedAdminAreas(event, adminLevel)
        .map((area) => parsePlaceCode(area.placeCode))
        .filter(isDefined);
}

// The exposed admin area of the event with the given place code, at any admin level.
export function getExposedAdminArea(
    event: NrwEvent,
    placeCode: PlaceCode,
): AdminAreaProperties | undefined {
    const match = Object.entries(event.exposedAdminAreas)
        .flatMap(([adminLevel, areas]) => areas.map((area) => ({ adminLevel, area })))
        .find(({ area }) => area.placeCode === placeCode);

    if (isNotDefined(match)) {
        return undefined;
    }

    return {
        adminLevel: Number(match.adminLevel) as AdminLevel,
        placeCode,
        name: match.area.name,
    };
}

// Whether the event can be drilled into below the given admin level: from the initial
// level down, the next level must have exposed admin areas and be fetchable by parent.
export function canNrwDrillBelow(event: NrwEvent, adminLevel: AdminLevel): boolean {
    const nextAdminLevel = (adminLevel + 1) as AdminLevel;

    return adminLevel >= getNrwInitialAdminLevel(event)
        && nextAdminLevel <= maxQueryableAdminLevel
        && getNrwExposedAdminLevels(event).includes(nextAdminLevel);
}

// The admin areas drilled through to show the given admin area, from the initial admin
// level down to its parent, read from its parent place codes and named by the event.
export function getNrwDrillPath(
    event: NrwEvent,
    initialAdminLevel: AdminLevel,
    adminArea: NrwAdminAreaProperties,
): AdminAreaProperties[] {
    return placeCodeLevelKeys
        .slice(initialAdminLevel, adminArea.adminLevel)
        .map((placeCodeLevelKey, index) => {
            const placeCode = parsePlaceCode(adminArea[placeCodeLevelKey]);
            if (placeCode === null) {
                return undefined;
            }

            return {
                adminLevel: (initialAdminLevel + index) as AdminLevel,
                placeCode,
                name: getExposedAdminArea(event, placeCode)?.name ?? placeCode,
            };
        })
        .filter(isDefined);
}
