import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

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

export function getNrwExposedAdminAreas(event: NrwEvent): NrwExposedAdminArea[] {
    const adminLevel = Object.keys(event.exposedAdminAreas)
        .map(Number)
        .filter((exposedAdminLevel) => exposedAdminLevel > 0) // only use sub-national admin levels
        .sort((a, b) => a - b)[0]; // least granular to most granular

    if (isNotDefined(adminLevel)) {
        return [];
    }

    return [...(event.exposedAdminAreas[String(adminLevel)] ?? [])].sort(
        (a, b) => (getNrwExposedPopulation(b) ?? 0) - (getNrwExposedPopulation(a) ?? 0),
    );
}

export function getNrwTotalExposedPopulation(areas: NrwExposedAdminArea[]): number {
    return areas.reduce((total, area) => total + (getNrwExposedPopulation(area) ?? 0), 0);
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

// The sub-national admin levels that have exposed admin areas, least granular first.
export function getNrwExposedAdminLevels(event: NrwEvent): AdminLevel[] {
    return Object.keys(event.exposedAdminAreas)
        .map(Number)
        .filter((adminLevel) => (
            adminLevel > 0 && (event.exposedAdminAreas[String(adminLevel)]?.length ?? 0) > 0
        ))
        .sort((a, b) => a - b) as AdminLevel[];
}

// The valid place codes of the exposed admin areas at the given admin level.
export function getNrwExposedPlaceCodes(event: NrwEvent, adminLevel: AdminLevel): PlaceCode[] {
    return (event.exposedAdminAreas[String(adminLevel)] ?? [])
        .map((area) => parsePlaceCode(area.placeCode))
        .filter((placeCode): placeCode is PlaceCode => placeCode !== null);
}
