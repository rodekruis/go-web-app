import MapOl from "ol/Map.js";
import { FeatureLike } from "ol/Feature";
import BaseLayer from "ol/layer/Base";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { noCountrySelectedValue } from "./ibfMap";
import {
  getAdminRegionUrl,
  getNestedAdminUrl,
  COL_ADMIN_LEVEL,
  COL_CODE,
  COL_COUNTRY,
} from "./ibfMapHelpers";
import {
  styleAdmin1region,
  styleAdmin2region,
  styleAdmin3Region,
} from "./ibfMapStyles";

export interface AdminLayerState {
  mapInstance: MapOl | null;
  admin1Layer: VectorLayer | null;
  admin2Layer: VectorLayer | null;
  admin3Layer: VectorLayer | null;
  selectedAdmin1Code: string | null;
  selectedAdmin2Code: string | null;
  selectedAdmin3Code: string | null;
  selectedAdminRegion: string;
  selectedEventId: string;
  isEventSelected: boolean;
  animComplete: boolean;
  affectedRegions: Map<string, string[]>;
}

// Show admin3 regions within a selected admin2 parent
export function showAdmin3Regions(
  state: AdminLayerState,
  country: string,
  parentCode: string,
): void {
  // Remove previous admin3 layer if exists
  if (state.admin3Layer) {
    state.mapInstance?.removeLayer(state.admin3Layer);
  }

  // Reset selected admin3 when showing new admin3 regions
  state.selectedAdmin3Code = null;

  state.admin3Layer = new VectorLayer({
    source: new VectorSource({
      url: getNestedAdminUrl(country, parentCode, 3),
      format: new GeoJSON(),
    }),
    style: (feature) => {
      const code = feature.get(COL_CODE);
      const affectedRegion =
        state.affectedRegions.get(state.selectedEventId) || null;
      return styleAdmin3Region(
        code,
        state.selectedAdmin3Code,
        affectedRegion,
        state.isEventSelected,
      );
    },
  });

  // Ensure admin3 renders above admin2
  state.admin3Layer.setZIndex(150);
  state.mapInstance?.addLayer(state.admin3Layer);
}

// Show admin2 regions within a selected admin1 parent
export function showAdmin2Regions(
  state: AdminLayerState,
  country: string,
  parentCode: string,
): void {
  // Remove previous admin2 and admin3 layers if they exist
  if (state.admin2Layer) {
    state.mapInstance?.removeLayer(state.admin2Layer);
  }
  if (state.admin3Layer) {
    state.mapInstance?.removeLayer(state.admin3Layer);
    state.admin3Layer = null;
  }

  // Reset selected admin2 and admin3 when showing new admin2 regions
  state.selectedAdmin2Code = null;
  state.selectedAdmin3Code = null;

  state.admin2Layer = new VectorLayer({
    source: new VectorSource({
      url: getNestedAdminUrl(country, parentCode, 2),
      format: new GeoJSON(),
    }),
    style: (feature) => {
      const code = feature.get(COL_CODE);
      return styleAdmin2region(
        code,
        state.selectedAdmin2Code,
        state.animComplete,
        state.isEventSelected,
      );
    },
  });

  // Ensure admin2 renders above admin1
  state.admin2Layer.setZIndex(120);
  state.mapInstance?.addLayer(state.admin2Layer);
}

// Show admin1 regions (top level)
export function showAdmin1Regions(state: AdminLayerState): void {
  // Remove previous admin1 layer if exists
  if (state.admin1Layer) {
    state.mapInstance?.removeLayer(state.admin1Layer);
  }
  state.admin1Layer = new VectorLayer({
    source: new VectorSource({
      url: getAdminRegionUrl(state.selectedAdminRegion, 1),
      format: new GeoJSON(),
    }),
    style: (feature) => {
      const code = feature.get(COL_CODE);
      return styleAdmin1region(
        code,
        state.selectedAdmin1Code,
        state.animComplete,
        state.isEventSelected,
      );
    },
  });

  // Ensure admin1 renders above base map tiles
  state.admin1Layer.setZIndex(100);
  state.mapInstance?.addLayer(state.admin1Layer);
}

// Handle a click on a map feature (admin region or event)
export function handleFeatureClick(
  state: AdminLayerState,
  feature: FeatureLike,
  layer: BaseLayer,
  eventLayer: VectorLayer | null,
  selectedCountry: string,
  onSelect: (country: string, adminLevel: number, regionCode: string) => void,
): boolean {
  const properties = feature.getProperties();

  // debug: print all the properties of the clicked feature
  console.log("Clicked feature properties222:", properties);

  // Check if clicked on an event
  if (layer === eventLayer) {
  }

  const newSelectedRegionCode =
    properties[COL_CODE] || noCountrySelectedValue;
  const newAdminLevel = properties[COL_ADMIN_LEVEL] || 0;

  console.log(`>>>>2 ${state.isEventSelected}`);
  let processAdmin3Clicks = layer === state.admin3Layer;
  // If an event is selected, only allow selecting admin3 regions that are affected
  if (processAdmin3Clicks && state.isEventSelected) {
    const affectedRegions =
      state.affectedRegions.get(state.selectedEventId) || [];
    if (!affectedRegions.includes(newSelectedRegionCode)) {
      processAdmin3Clicks = false;
    }
  }

  // Check if clicked on admin3 layer
  if (processAdmin3Clicks) {
    console.log(`>>>>processAdmin3Clicks ${state.isEventSelected}`);
    state.selectedAdmin3Code = newSelectedRegionCode;
    state.admin3Layer?.changed();
    state.admin2Layer?.changed();
    state.admin1Layer?.changed();

    // Zoom to admin3 region
    const geometry = feature.getGeometry?.();
    if (geometry) {
      const extent = geometry.getExtent();
      if (
        extent[0] !== undefined &&
        extent[1] !== undefined &&
        extent[2] !== undefined &&
        extent[3] !== undefined
      ) {
        const center: [number, number] = [
          (extent[0] + extent[2]) / 2,
          (extent[1] + extent[3]) / 2,
        ];
        state.animComplete = false;
        state.mapInstance?.getView().animate(
          {
            center,
            zoom: 11,
            duration: 500,
          },
          () => {
            state.animComplete = true;
          },
        );
      }
    }
    return true;
  }

  console.log(`>>>>admin2 ${state.isEventSelected}`);
  // Check if clicked on admin2 layer
  if (layer === state.admin2Layer && state.isEventSelected === false) {
    onSelect(
      properties[COL_COUNTRY] || "",
      newAdminLevel,
      newSelectedRegionCode,
    );

    // Update selected admin2 code and refresh styles
    state.selectedAdmin2Code = newSelectedRegionCode;
    state.admin2Layer?.changed();

    // Show admin3 regions for the selected admin2
    showAdmin3Regions(
      state,
      properties[COL_COUNTRY] || selectedCountry,
      newSelectedRegionCode,
    );

    // Zoom to admin2 region
    const geometry = feature.getGeometry?.();
    if (geometry) {
      const extent = geometry.getExtent();
      if (
        extent[0] !== undefined &&
        extent[1] !== undefined &&
        extent[2] !== undefined &&
        extent[3] !== undefined
      ) {
        const center: [number, number] = [
          (extent[0] + extent[2]) / 2,
          (extent[1] + extent[3]) / 2,
        ];
        state.animComplete = false;
        state.mapInstance?.getView().animate(
          {
            center,
            zoom: 10,
            duration: 500,
          },
          () => {
            state.animComplete = true;
          },
        );
      }
    }
    return true;
  }

  console.log(`>>>>admin1 ${state.isEventSelected}`);
  // Clicked on admin1 layer
  if (layer === state.admin1Layer && state.isEventSelected === false) {
    onSelect(
      properties[COL_COUNTRY] || "",
      newAdminLevel,
      newSelectedRegionCode,
    );

    // Update selected admin1 code and refresh styles
    state.selectedAdmin1Code = newSelectedRegionCode;
    state.admin1Layer?.changed();

    // Show admin2 regions for the selected admin1
    showAdmin2Regions(
      state,
      properties[COL_COUNTRY] || selectedCountry,
      newSelectedRegionCode,
    );

    // Zoom to admin1 region
    const geometry = feature.getGeometry?.();
    if (geometry) {
      const extent = geometry.getExtent();
      if (
        extent[0] !== undefined &&
        extent[1] !== undefined &&
        extent[2] !== undefined &&
        extent[3] !== undefined
      ) {
        const center: [number, number] = [
          (extent[0] + extent[2]) / 2,
          (extent[1] + extent[3]) / 2,
        ];
        state.animComplete = false;
        state.mapInstance?.getView().animate(
          {
            center,
            zoom: 8,
            duration: 500,
          },
          () => {
            state.animComplete = true;
          },
        );
      }
    }
  }

  // this is not hit
  state.selectedAdminRegion = newSelectedRegionCode;

  return true;
}
