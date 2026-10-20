import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import { getNrwExposedPopulationByPlaceCode } from '#utils/nrw/events';
import {
    type NrwAdminAreaFeatureCollection,
    type NrwEvent,
    type NrwLegendCategory,
    unbounded,
} from '#views/CountryProfileNationalRiskWatch/types';

type MapColorRamp = readonly [string, string, string, string, string];

// The design defines "Map <colour> 65%", ordered from the lightest (10) to the
// darkest (90) tint. Mapbox paint expressions need literal colours, so these
// mirror the tokens in nrw.css.
export const alertClassMapRamps: Record<NrwEvent['alertClass'], MapColorRamp> = {
    low: ['#fff9ea', '#ffedbc', '#ffdf8a', '#ffc635', '#d99a00'],
    medium: ['#fff5ea', '#ffd3aa', '#ffb066', '#ff6e00', '#c24e00'],
    high: ['#fef1f2', '#fcc6ca', '#fa999f', '#f5333f', '#c01825'],
};

export const floodDepthMapRamp: MapColorRamp = ['#cbddf2', '#9ebadc', '#6e96c5', '#467abc', '#3163a0'];

export const mapFillOpacity = 0.65;
export const mapFillHoverOpacity = 0.8;
export const mapOutlineWidth = 2;

export interface MapFlatStyle {
    fillColor: string;
    fillOpacity: number;
    fillHoverOpacity: number;
    outlineColor: string;
    outlineWidth: number;
}

// Grey 40 with the map shadow outline.
export const mapUnselectedStyle: MapFlatStyle = {
    fillColor: '#c6c6c6',
    fillOpacity: 0.5,
    fillHoverOpacity: 0.8,
    outlineColor: 'rgba(50, 50, 50, 0.2)',
    outlineWidth: 2,
};

export const mapUnexposedStyle: MapFlatStyle = {
    fillColor: '#ffffff',
    fillOpacity: 0.4,
    fillHoverOpacity: 0.6,
    outlineColor: 'rgba(77, 77, 77, 0.25)',
    outlineWidth: 0.8,
};

export type EqualIntervalBreaks = [number, number, number, number];

// Split 0..max into five equal bands, one per ramp tint, so the scale fits any
// magnitude (hundreds or millions) with the same method for every hazard and country.
// Returns the four lower bounds of the bands above the first.
export function getEqualIntervalBreaks(values: number[]): EqualIntervalBreaks {
    const max = Math.max(0, ...values);
    const bandWidth = max / 5;

    return [bandWidth, 2 * bandWidth, 3 * bandWidth, 4 * bandWidth];
}

// The breaks of the choropleth of the admin areas on the map, scaled to the
// exposed population of those areas only. Shared by the fill layer and the legend.
export interface NrwExposedPopulationScale {
    ramp: MapColorRamp;
    // Undefined when none of the areas has exposed population, so the map draws a flat fill.
    breaks: EqualIntervalBreaks | undefined;
    exposedPopulationByPlaceCode: Map<string, number>;
}

export function getExposedPopulationScale(
    event: NrwEvent,
    adminAreas: NrwAdminAreaFeatureCollection,
): NrwExposedPopulationScale {
    const exposedPopulationByPlaceCode = getNrwExposedPopulationByPlaceCode(event);
    const breaks = getEqualIntervalBreaks(
        adminAreas.features
            .map((feature) => exposedPopulationByPlaceCode.get(feature.properties.placeCode))
            .filter(isDefined),
    );

    const hasExposedPopulation = breaks[0] > 0;
    return {
        ramp: alertClassMapRamps[event.alertClass],
        breaks: hasExposedPopulation ? breaks : undefined,
        exposedPopulationByPlaceCode,
    };
}

// The ramp tint of a value, in the band it falls in. A band starts at its break,
// like a Mapbox step expression, and a set without values shares the first tint.
export function getRampColor(
    ramp: MapColorRamp,
    breaks: EqualIntervalBreaks,
    value: number | undefined,
): string {
    if (breaks[0] <= 0 || isNotDefined(value)) return ramp[0];

    const bandIndex = breaks.filter((lowerBound) => value >= lowerBound).length;
    return ramp[bandIndex] ?? ramp[0];
}

// The bands of the ramp as legend entries, the first and last open-ended.
export function getRampCategories(
    ramp: MapColorRamp,
    breaks: EqualIntervalBreaks,
): NrwLegendCategory[] {
    const bounds = [unbounded, ...breaks, unbounded];

    return ramp.map((color, index) => ({
        color,
        from: bounds[index],
        to: bounds[index + 1],
    }));
}
