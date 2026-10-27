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

// Global classes in nrw.css that set --nrw-color-alert, -tint and -contrast.
export const alertClassNames: Record<NrwEvent['alertClass'], string> = {
    low: 'nrw-alert-low',
    medium: 'nrw-alert-medium',
    high: 'nrw-alert-high',
};

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

// These colours and labels mirror the backend's FLOOD_DEPTH_CONFIG palette and outer thresholds.
export const floodDepthMapRamp: MapColorRamp = ['#cbddf2', '#9ebadc', '#6e96c5', '#467abc', '#3163a0'];
export const floodDepthMapLabels = {
    low: '<0.25 m',
    high: '>2.5 m',
} as const;

// Mapbox paint needs literal values, so these mirror --nrw-color-map-shadow-outline in nrw.css.
export const mapOutlineColor = '#323232';
export const mapOutlineOpacity = 0.2;
export const mapOutlineWidth = 0.8;

export interface MapFlatStyle {
    fillColor: string;
    fillOpacity: number;
    fillHoverOpacity: number;
    outlineColor: string;
    outlineOpacity: number;
    outlineWidth: number;
}

// Grey 40 with the map shadow outline.
export const mapUnselectedStyle: MapFlatStyle = {
    fillColor: '#c6c6c6',
    fillOpacity: 0.5,
    fillHoverOpacity: 0.8,
    outlineColor: mapOutlineColor,
    outlineOpacity: mapOutlineOpacity,
    outlineWidth: 2,
};

export const mapUnexposedStyle: MapFlatStyle = {
    fillColor: '#ffffff',
    fillOpacity: 0.4,
    fillHoverOpacity: 0.6,
    outlineColor: '#4d4d4d',
    outlineOpacity: 0.25,
    outlineWidth: 0.8,
};

// Ramp step indices used for fewer distinct values than steps, lightest to darkest.
const rampStepIndicesByValueCount: Record<number, readonly number[]> = {
    1: [2],
    2: [1, 3],
    3: [0, 2, 4],
    4: [0, 2, 3, 4],
};

// Few distinct values use spread-out steps, and more fill all steps in classes of
// equal area count by rank. Equal values share the step of their first rank.
function getStepIndexByValue(stepCount: number, values: number[]): Map<number, number> {
    const sortedValues = [...values].sort((a, b) => a - b);
    const distinctValues = [...new Set(sortedValues)];
    const stepIndices = rampStepIndicesByValueCount[distinctValues.length];

    return new Map(distinctValues.map((value, distinctRank) => [
        value,
        stepIndices?.[distinctRank]
            ?? Math.floor((sortedValues.indexOf(value) * stepCount) / sortedValues.length),
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

// The lowest value of each step. A step without values gets one extended linearly
// from the two nearest steps with values, or by half the value with only one.
function getStepLowerBounds(stepCount: number, stepIndexByValue: Map<number, number>): number[] {
    const lowestValues: { step: number, value: number }[] = [];
    stepIndexByValue.forEach((step, value) => {
        if (lowestValues.at(-1)?.step !== step) {
            lowestValues.push({ step, value });
        }
    });

    return Array.from({ length: stepCount }, (_, step) => {
        const [nearest, secondNearest] = [...lowestValues]
            .sort((a, b) => Math.abs(a.step - step) - Math.abs(b.step - step));

        if (isNotDefined(nearest)) {
            return 0;
        }
        if (nearest.step === step) {
            return nearest.value;
        }

        const valuePerStep = isDefined(secondNearest)
            ? (secondNearest.value - nearest.value) / (secondNearest.step - nearest.step)
            : nearest.value / 2;
        return nearest.value + valuePerStep * (step - nearest.step);
    });
}

// The steps of the ramp as legend entries, the first and last open-ended.
export function getRampCategories(
    ramp: MapRamp,
    values: number[],
): NrwLegendCategory[] {
    const lowerBounds = getStepLowerBounds(
        ramp.length,
        getStepIndexByValue(ramp.length, values),
    );

    return ramp.map((step, index) => ({
        color: getRampStepCssColor(step),
        from: index === 0 ? unbounded : lowerBounds[index],
        to: index === ramp.length - 1 ? unbounded : lowerBounds[index + 1],
    }));
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
