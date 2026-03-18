import { FeatureLike } from "ol/Feature";
import { CountryData, isoA2CountryNameProperty } from "./ibfMap";
import { Fill, Stroke, Style } from 'ol/style';
import Circle from 'ol/style/Circle';

export type MvtStyleCreator = (feature: FeatureLike, selected: string) => Style;

// Debug style
// Fix later
//
// Style for vector tile (MVT) maps
export const styleMvtGreyWorldMap : MvtStyleCreator = (feature: FeatureLike, selected: string) => {
    const iso_a2 = feature.get(isoA2CountryNameProperty);
    const isSelected = iso_a2 === selected;
    const countryInfo = CountryData.get(iso_a2);
    const isIbfSupported = countryInfo?.ibfSupported ?? false;

    let fillColor = "#000000";

    if (isIbfSupported) {
        fillColor = isSelected ? "#f98cc2" : "#f8bbd9" ;
    }
    else {
        fillColor = isSelected ? "#ababab" : "#e0e0e0";
    }

    return new Style({
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({ color: "#a4a4a4", width: 1 }),
    });
}

// Debug style
// Fix later
//
// Style for vector tile (MVT) maps
export const styleSelectedCountryOverlay : MvtStyleCreator = (feature: FeatureLike, selected: string) => {
    const iso_a2 = feature.get(isoA2CountryNameProperty);
    const isSelected = iso_a2 === selected;
    const fillColor = isSelected ? "#ff00ee0a" : "#00000000";
    return new Style({
        fill: new Fill({ color: fillColor })
    });
}

// Admin child borders style (e.g., admin3 regions)
export const styleChildBorder = (code: string, selectedChildCode: string | null): Style => {
    // Highlight selected child region in orange
    if (code === selectedChildCode) {
        return new Style({
            fill: new Fill({
                color: "rgba(255, 152, 0, 0.7)",
            }),
            stroke: new Stroke({
                color: "#e65100",
                width: 2,
            }),
        });
    }
    return new Style({
        fill: new Fill({
            color: "rgba(76, 175, 80, 0.6)",
        }),
        stroke: new Stroke({
            color: "#2e7d32",
            width: 1,
        }),
    });
};

// Admin border style (e.g., admin2 regions)
export const styleAdminBorder = (code: string, selectedCode: string | null, animComplete: boolean): Style => {
    // Don't fill the selected region
    if (code === selectedCode && animComplete) {
        return new Style({
            stroke: new Stroke({
                color: "#fc1de6",
                width: 1,
            }),
        });
    }
    return new Style({
        fill: new Fill({
            color: "rgba(87, 152, 227, 0.84)",
        }),
        stroke: new Stroke({
            color: "#fc1de6",
            width: 1,
        }),
    });
};

// GLOFAS stations point style
export const styleGlofasStation = new Style({
    image: new Circle({
        radius: 6,
        fill: new Fill({
            color: "rgba(255, 0, 0, 0.8)",
        }),
        stroke: new Stroke({
            color: "#8b0000",
            width: 1,
        }),
    }),
});