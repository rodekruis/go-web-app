import { FeatureLike } from "ol/Feature";
import { CountryData, isoA2CountryNameProperty } from "./ibfMap";
import { Fill, Stroke, Style } from "ol/style";
import Circle from "ol/style/Circle";

export type MvtStyleCreator = (feature: FeatureLike, selected: string) => Style;
const deselectedColor = "rgba(0, 0, 0, 0.07)";
// Debug style
// Fix later
//
// Style for vector tile (MVT) maps
export const styleMvtGreyWorldMap: MvtStyleCreator = (
  feature: FeatureLike,
  selected: string,
) => {
  const iso_a2 = feature.get(isoA2CountryNameProperty);
  const isSelected = iso_a2 === selected;
  const countryInfo = CountryData.get(iso_a2);
  const isIbfSupported = countryInfo?.ibfSupported ?? false;

  let fillColor = "#000000";

  if (isIbfSupported) {
    fillColor = isSelected ? "#f98cc2" : "#f8bbd9";
  } else {
    fillColor = isSelected ? "#ababab" : "#e0e0e0";
  }

  return new Style({
    fill: new Fill({ color: fillColor }),
    stroke: new Stroke({ color: "#a4a4a4", width: 1 }),
  });
};

// Debug style
// Fix later
//
// Style for vector tile (MVT) maps
export const styleSelectedCountryOverlay: MvtStyleCreator = (
  feature: FeatureLike,
  selected: string,
) => {
  const iso_a2 = feature.get(isoA2CountryNameProperty);
  const isSelected = iso_a2 === selected;
  const fillColor = isSelected ? "#ff00ee0a" : "#00000000";
  return new Style({
    fill: new Fill({ color: fillColor }),
  });
};


// Admin child borders style (e.g., admin3 regions)
export const styleAdmin3Region_clear = (
  code: string,
  selectedChildCode: string | null,
  affectedRegions: string[] | null,
  isEventSelected: boolean,
): Style => {
  if (isEventSelected && affectedRegions && affectedRegions.includes(code)) {
    if (selectedChildCode === null) {
      return new Style({
        fill: new Fill({
          color: "rgba(255, 123, 0, 0.2)",
        }),
        stroke: new Stroke({
          color: "#ff990091",
          width: 2,
        }),
      });
    }
    if (code === selectedChildCode) {
      return new Style({
        fill: new Fill({
          color: "rgba(255, 106, 0, 0)",
        }),
        stroke: new Stroke({
          color: "#e65100",
          width: 2,
        }),
      });
    }
    else {
      return new Style({
        fill: new Fill({
          color: "rgba(0, 0, 0, 0.06)",
        }),
        stroke: new Stroke({
          color: "#e65100",
          width: 2,
        }),
      });
    }
  }
  if (!isEventSelected) {
    return new Style({
      fill: new Fill({
        color: "rgba(32, 194, 29, 0.72)",
      }),
      stroke: new Stroke({
        color: "#169b248e",
        width: 2,
      }),
    });
  }
  return new Style({
    fill: new Fill({
      color: deselectedColor,
    }),
    stroke: new Stroke({
      color: deselectedColor,
      width: 2,
    }),
  });
};


// Admin child borders style (e.g., admin3 regions)
export const styleAdmin3Region = (
  code: string,
  selectedChildCode: string | null,
  affectedRegions: string[] | null,
  isEventSelected: boolean
): Style => {
  // Highlight selected child region in orange
  if (code === selectedChildCode) {
    return new Style({
      fill: new Fill({
        color: "rgba(255, 106, 0, 0)",
      }),
      stroke: new Stroke({
        color: "#e65100",
        width: 2,
      }),
    });
  }
  if (isEventSelected && affectedRegions && affectedRegions.includes(code)) {
    return new Style({
      fill: new Fill({
        color: "rgba(255, 123, 0, 0.72)",
      }),
      stroke: new Stroke({
        color: "#d58711c2",
        width: 2,
      }),
    });
  }
  if (!isEventSelected) {
    return new Style({

          fill: new Fill({
      color: "rgba(32, 194, 29, 0.72)",
    }),
    stroke: new Stroke({
      color: "#169b248e",
      width: 2,
    }),
    });
  }
  return new Style({
      fill: new Fill({
      color: deselectedColor,
    }),
    stroke: new Stroke({
      color: deselectedColor,
      width: 2,
      }),
  });
};

export const styleAdmin2region = (
  code: string,
  selectedCode: string | null,
  isEventSelected: boolean,
): Style => {
  // Don't fill the selected region if the selected code starts with code
  if (selectedCode && selectedCode.startsWith(code)) {
    return new Style({

    });
  }
  // If an event is selected, return white at 50% alpha
  if (isEventSelected) {
    return new Style({
      fill: new Fill({
        color: deselectedColor,
      }),
      stroke: new Stroke({
        color: deselectedColor,
        width: 2,
      }),
    });
  }
  return new Style({
    fill: new Fill({
      color: "rgba(87, 152, 227, 0.84)",
    }),
    stroke: new Stroke({
      color: "rgba(35, 113, 203, 0.84)",
      width: 2,
    }),
  });
};

export const styleAdmin1region = (
  code: string,
  selectedCode: string | null,
  isEventSelected: boolean,
): Style => {
  // Don't fill the selected region
  if (selectedCode && selectedCode.startsWith(code)) {
    return new Style({
      stroke: new Stroke({
        color: "#fcfc1d",
        width: 1,
      }),
    });
  }
  // If an event is selected, return white at 50% alpha
  if (isEventSelected) {
    return new Style({
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.5)",
      }),
      stroke: new Stroke({
        color: "rgba(255, 255, 255, 0.5)",
        width: 2,
      }),
    });
  }
  return new Style({
    fill: new Fill({
      color: "rgba(112, 119, 93, 0.38)",
    }),
    stroke: new Stroke({
      color: "#595959",
      width: 2,
    }),
  });
};

// GLOFAS stations point style
export const styleGlofasStation = new Style({
  image: new Circle({
    radius: 10,
    fill: new Fill({
      color: "rgba(235, 96, 96, 0.8)",
    }),
    stroke: new Stroke({
      color: "#8b0000",
      width: 1,
    }),
  }),
});
