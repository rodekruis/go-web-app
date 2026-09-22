import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

// Figma "Map <colour> 65%" ramps, ordered from the lightest (10) to the darkest (90) tint.
// Mapbox paint expressions need literal colours, so these mirror the tokens in nrw.css.
export const alertClassMapRamps: Record<NrwEvent['alertClass'], readonly [
    string, string, string, string, string,
]> = {
    low: ['#fff9ea', '#ffedbc', '#ffdf8a', '#ffc635', '#d99a00'],
    medium: ['#fff5ea', '#ffd3aa', '#ffb066', '#ff6e00', '#c24e00'],
    high: ['#fef1f2', '#fcc6ca', '#fa999f', '#f5333f', '#c01825'],
};

export const mapFillOpacity = 0.65;
export const mapFillHoverOpacity = 0.8;
// Mapbox only parses the legacy comma colour syntax.
export const mapOutlineColor = 'rgba(50, 50, 50, 0.2)';

// Split 0..max into five equal bands, one per ramp tint, so the scale fits any
// magnitude (hundreds or millions) with the same method for every hazard and country.
// Returns the four lower bounds of the bands above the first.
export function getEqualIntervalBreaks(values: number[]): [number, number, number, number] {
    const max = Math.max(0, ...values);
    const bandWidth = max / 5;

    return [bandWidth, 2 * bandWidth, 3 * bandWidth, 4 * bandWidth];
}
