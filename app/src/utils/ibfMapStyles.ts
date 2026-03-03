import { CountryData } from "./ibfMap";
import { Fill, Stroke, Style } from 'ol/style';

export type MvtStyleCreator = (feature: any, selected: string) => Style;

// Debug style
// Fix later
//
// Style for vector tile (MVT) maps
export const styleMvtGreyWorldMap : MvtStyleCreator = (feature: any, selected: string) => {
    const iso_a2 = feature.get('iso_a2');
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
export const styleMvtZoomedGrey : MvtStyleCreator = (feature: any, selected: string) => {
    const iso_a2 = feature.get('iso_a2');
    const isSelected = iso_a2 === selected;
    const countryInfo = CountryData.get(iso_a2);
    const isIbfSupported = countryInfo?.ibfSupported ?? false;
    let fillColor = isSelected ? "#bac5e8" : isIbfSupported ? "#f8bbd9" : "#e0e0e0";


    return new Style({
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({ color: "#a4a4a4", width: 1 }),
    });
}

// Debug style
// Fix later
//
// Style for vector tile (MVT) maps
export const testStyle : MvtStyleCreator = (feature: any, selected: string) => {
    const iso_a2 = feature.get('iso_a2');
    const isSelected = iso_a2 === selected;
    const countryInfo = CountryData.get(iso_a2);
    const isIbfSupported = countryInfo?.ibfSupported ?? false;

    let fillColor = isIbfSupported ? "#708ed2" : "#c2c2c2";
    fillColor = isSelected ? "#85c1c1" : fillColor;
    return new Style({
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({ color: "#a4a4a4", width: 1 }),
    });
}