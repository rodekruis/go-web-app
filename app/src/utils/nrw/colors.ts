import { isDefined } from '@togglecorp/fujs';

import { getNrwExposedPopulationByPlaceCode } from '#utils/nrw/events';
import {
    type NrwAdminAreaFeatureCollection,
    type NrwEvent,
    type NrwLegendCategory,
} from '#views/CountryProfileNationalRiskWatch/types';

type MapColorRamp = readonly [string, string, string, string, string];

export interface MapRampStep {
    color: string;
    opacity: number;
    hoverOpacity: number;
}

type MapRamp = readonly [MapRampStep, MapRampStep, MapRampStep, MapRampStep, MapRampStep];

// The design defines five steps per alert colour, from the lightest (10) to the darkest (90).
export const alertClassMapRamps: Record<NrwEvent['alertClass'], MapRamp> = {
    low: [
        { color: '#ffb900', opacity: 0.15, hoverOpacity: 0.3 },
        { color: '#ffba00', opacity: 0.3, hoverOpacity: 0.45 },
        { color: '#ffb900', opacity: 0.5, hoverOpacity: 0.6 },
        { color: '#ffb700', opacity: 0.7, hoverOpacity: 0.8 },
        { color: '#d9a900', opacity: 0.8, hoverOpacity: 0.9 },
    ],
    medium: [
        { color: '#ff7900', opacity: 0.15, hoverOpacity: 0.25 },
        { color: '#ff7b00', opacity: 0.3, hoverOpacity: 0.4 },
        { color: '#ff7b00', opacity: 0.45, hoverOpacity: 0.55 },
        { color: '#ff6e00', opacity: 0.6, hoverOpacity: 0.7 },
        { color: '#c24e00', opacity: 0.8, hoverOpacity: 0.9 },
    ],
    high: [
        { color: '#f4000b', opacity: 0.15, hoverOpacity: 0.3 },
        { color: '#f20012', opacity: 0.3, hoverOpacity: 0.45 },
        { color: '#f3000f', opacity: 0.45, hoverOpacity: 0.55 },
        { color: '#f3000f', opacity: 0.6, hoverOpacity: 0.7 },
        { color: '#b9000e', opacity: 0.75, hoverOpacity: 0.85 },
    ],
};

export const floodDepthMapRamp: MapColorRamp = ['#cbddf2', '#9ebadc', '#6e96c5', '#467abc', '#3163a0'];

// Mapbox paint needs literal values, so these mirror --nrw-color-map-shadow-outline in nrw.css.
export const mapOutlineColor = '#323232';
export const mapOutlineOpacity = 0.2;
export const mapOutlineWidth = 0.8;

// Ramp step indices used for fewer distinct values than steps, lightest to darkest.
const rampStepIndicesByValueCount: Record<number, readonly number[]> = {
    1: [2],
    2: [1, 3],
    3: [0, 2, 4],
    4: [0, 2, 3, 4],
};

// Rank the distinct values, so few values use spread-out steps and more values
// fill all steps in classes of equal count.
function getStepIndexByValue(stepCount: number, values: number[]): Map<number, number> {
    const distinctValues = [...new Set(values)].sort((a, b) => a - b);
    const stepIndices = rampStepIndicesByValueCount[distinctValues.length];

    return new Map(distinctValues.map((value, rank) => [
        value,
        stepIndices?.[rank] ?? Math.floor((rank * stepCount) / distinctValues.length),
    ]));
}

// Unknown values get the lightest step.
export function createRampStepGetter(
    ramp: MapRamp,
    values: number[],
): (value: number | undefined) => MapRampStep {
    const stepByValue = new Map(
        [...getStepIndexByValue(ramp.length, values)]
            .map(([value, stepIndex]) => [value, ramp[stepIndex]]),
    );

    return (value) => (isDefined(value) ? stepByValue.get(value) : undefined) ?? ramp[0];
}

export function getRampStepCssColor(step: MapRampStep): string {
    return `color-mix(in srgb, ${step.color} ${step.opacity * 100}%, transparent)`;
}

// The steps of the ramp as legend entries, each spanning the values ranked into it.
export function getRampCategories(
    ramp: MapRamp,
    values: number[],
): NrwLegendCategory[] {
    const stepIndexByValue = getStepIndexByValue(ramp.length, values);

    return ramp.map((step, index) => {
        const stepValues = [...stepIndexByValue]
            .filter(([, stepIndex]) => stepIndex === index)
            .map(([value]) => value);

        return {
            color: getRampStepCssColor(step),
            from: stepValues.at(0),
            to: stepValues.at(-1),
        };
    });
}

// The colour scale of the admin areas on the map, ranked by the exposed population
// of those areas only. Shared by the fill layer, the admin area list and the legend.
export interface NrwExposedPopulationScale {
    getRampStep: (value: number | undefined) => MapRampStep;
    // Undefined when none of the areas has exposed population, so the map draws a flat fill.
    categories: NrwLegendCategory[] | undefined;
    exposedPopulationByPlaceCode: Map<string, number>;
}

export function getExposedPopulationScale(
    event: NrwEvent,
    adminAreas: NrwAdminAreaFeatureCollection,
): NrwExposedPopulationScale {
    const exposedPopulationByPlaceCode = getNrwExposedPopulationByPlaceCode(event);
    const values = adminAreas.features
        .map((feature) => exposedPopulationByPlaceCode.get(feature.properties.placeCode))
        .filter(isDefined);
    const ramp = alertClassMapRamps[event.alertClass];

    const hasExposedPopulation = values.some((value) => value > 0);
    return {
        getRampStep: createRampStepGetter(ramp, values),
        categories: hasExposedPopulation ? getRampCategories(ramp, values) : undefined,
        exposedPopulationByPlaceCode,
    };
}
