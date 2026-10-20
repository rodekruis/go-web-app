// Popups and tooltips sit above-right of their anchor by default. Flip them
// when the anchor is this close to the top or a side edge of the map.
// Thresholds approximate 1.5x a popup's height and width. Brittle, but sizes
// change rarely.
export const popupFlipTopThreshold = 100;
export const popupFlipRightThreshold = 375;
export const popupFlipLeftThreshold = 375;
