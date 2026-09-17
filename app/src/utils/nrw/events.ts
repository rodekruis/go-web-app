import { isNotDefined } from '@togglecorp/fujs';

import { nrwLayerNames } from '#utils/nrw/layers';
import {
    type NrwEvent,
    type NrwExposedAdminArea,
} from '#views/CountryProfileNationalRiskWatch/types';

export function getNrwExposedPopulation(area: NrwExposedAdminArea): number | undefined {
    return area.exposure.find(
        ({ layerName }) => layerName === nrwLayerNames.exposedPopulation,
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
