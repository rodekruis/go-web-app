import { isDefined } from '@togglecorp/fujs';

import supportedLayerNames from '#utils/nrw/layers';
import {
    type AdminLevel,
    type NrwEvent,
    type NrwExposedAdminArea,
    type PlaceCode,
} from '#views/CountryProfileNationalRiskWatch/types';
import { parsePlaceCode } from '#views/CountryProfileNationalRiskWatch/utils';

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
