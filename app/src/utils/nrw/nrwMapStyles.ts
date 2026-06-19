import { type FeatureLike } from 'ol/Feature';
import {
    Circle,
    Fill,
    Stroke,
    Style,
} from 'ol/style';

import { COUNTRY_FIELD_KEY } from './nrwConstants';
import { AlertClassType } from './nrwMapTypes';

export type MvtStyleCreator = (feature: FeatureLike, selected: string) => Style;
const defaultAdminAreaBorderWidth = 1;
const defaultPointWidth = 2;

type AdminLevel = 1 | 2 | 3 | 4;

const noEventAdminAreaFillColors: Record<AdminLevel, string> = {
    1: 'rgba(112, 119, 93, 0.38)',
    2: 'rgba(87, 152, 227, 0.84)',
    3: 'rgba(32, 194, 29, 0.72)',
    4: 'rgba(255, 105, 180, 0.72)',
};

const noEventAdminAreaStrokeColors: Record<AdminLevel, string> = {
    1: '#595959',
    2: 'rgba(35, 113, 203, 0.84)',
    3: '#169b248e',
    4: '#ff1493',
};

const exposedAreaFillAlphaHex = 'A6'; // 0.65
const exposedAreaFillAlphaHexLight = '33'; // 0.2

// Color steps for each alert class
export const alertColors: Record<AlertClassType, string[]> = {
    [AlertClassType.Low]: ['#FFF9EA', '#FFEDBC', '#FFDF8A', '#FFC635', '#D99A00'],
    [AlertClassType.Medium]: ['#FFF5EA', '#FFD3AA', '#FFB066', '#FF6E00', '#C24E00'],
    [AlertClassType.High]: ['#FEF1F2', '#FCC6CA', '#FA999F', '#F5333F', '#C01825'],
};

// Get the color string for an exposed area
const getExposureColor = (
    value: number,
    maxValue: number,
    alertClass: AlertClassType,
): string => {
    const colors = alertColors[alertClass];
    const normalizedValue = maxValue > 0 ? Math.min(value / maxValue, 1) : 0;
    // Get index of 0 to 4 based on a 0 to 1 normalized value.
    // 5 is simplified from (n*10)/2
    // 10 = make it convertible to an int, and 2 = width of color steps
    const tier = Math.floor(normalizedValue * 5);
    // Group the highest value (1.0) into the lower tier
    const index = Math.min(tier, 4);
    return colors[index]!;
};

// TODO: review the styling for perf in terms of what to render, and how to reduce
// the number of features that must be looped through when styling

export const styleAdmin0 = (
    feature: FeatureLike,
    selectedCountry: string,
) => {
    const country = feature.get(COUNTRY_FIELD_KEY);
    const isSelected = country === selectedCountry;
    return new Style({
        fill: new Fill({
            color: isSelected ? 'rgba(112, 119, 93, 0.55)' : 'rgba(0, 0, 0, 0.07)',
        }),
        stroke: new Stroke({
            color: '#8d8d8d',
            width: 1,
        }),
    });
};

export const styleAdmin1 = (
    feature: FeatureLike,
    selectedCountry: string,
) => {
    const country = feature.get(COUNTRY_FIELD_KEY);
    const isSelectedCountry = country === selectedCountry;
    return new Style({
        fill: new Fill({
            color: isSelectedCountry ? 'rgba(87, 152, 227, 0.35)' : 'rgba(87, 152, 227, 0.2)',
        }),
        stroke: new Stroke({
            color: 'rgba(35, 113, 203, 0.84)',
            width: 1,
        }),
    });
};

// Style for an admin area when an event is selected
export const styleAdminForEvent = (
    pCode: string,
    selectedChildCode: string | null,
    exposedPopulation: Record<string, number> | null,
    maxExposedPopulation: number,
    alertClass: AlertClassType,
    isDeepestAdminLevel: boolean,
): Style => {
    // Only color the deepest level
    if (!isDeepestAdminLevel) {
        return new Style({});
    }

    // Unexposed areas not displayed
    if (!exposedPopulation || exposedPopulation[pCode] === undefined) {
        return new Style({});
    }

    // Color based on exposed population
    const population = exposedPopulation[pCode] ?? 0;
    const baseColor = getExposureColor(population, maxExposedPopulation, alertClass);

    // If nothing selected at the deepest level is selected, or if the current area is selected,
    // render at standard opacity.
    // Else, render at a lighter opacity.
    const isStandardOpacity = selectedChildCode === null || selectedChildCode === pCode;
    const alphaHex = isStandardOpacity ? exposedAreaFillAlphaHex : exposedAreaFillAlphaHexLight;

    return new Style({
        fill: new Fill({
            color: `${baseColor}${alphaHex}`,
        }),
        stroke: new Stroke({
            color: baseColor,
            width: defaultAdminAreaBorderWidth,
        }),
    });
};

// Simplified style for an admin area when no event is selected.
// Color is chosen by admin level.
// Note: Selected areas are not rendered, even at the lowest level.
// This is part of the debug UI while we wait for design.
export const styleAdminNoEvent = (
    pCode: string,
    selectedCode: string | null,
    adminLevel: AdminLevel,
): Style => {
    if (selectedCode && selectedCode.startsWith(pCode)) {
        return new Style({});
    }
    return new Style({
        fill: new Fill({
            color: noEventAdminAreaFillColors[adminLevel],
        }),
        stroke: new Stroke({
            color: noEventAdminAreaStrokeColors[adminLevel],
            width: defaultAdminAreaBorderWidth,
        }),
    });
};

export const styleRcBranchPoint = new Style({
    image: new Circle({
        radius: 6,
        fill: new Fill({
            color: '#cc1111',
        }),
        stroke: new Stroke({
            color: '#ffffff',
            width: defaultPointWidth,
        }),
    }),
});

export const styleClinicPoint = new Style({
    image: new Circle({
        radius: 6,
        fill: new Fill({
            color: '#6a1b9a',
        }),
        stroke: new Stroke({
            color: '#ffffff',
            width: defaultPointWidth,
        }),
    }),
});
