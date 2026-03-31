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
  selectedAdmin1Code: string | null;
  selectedAdmin2Code: string | null;
  selectedAdmin3Code: string | null;
  selectedAdminRegion: string;
  selectedEventId: string;
  isEventSelected: boolean;
  animComplete: boolean;
}

function getAffectedRegionsForEvent(eventId: string): string[] {
  // TODO: debug code
  // Replace with actual event data
  if (eventId == "event1") {
    return ["MW31104", "MW31106", "MW31105", "MW31108", "MW31109"];
  }
  return ["MW30703", "MW30707", "MW30708", "MW30704", "MW30706", "MW30705"];
}

const zIndexMap = { 1: 100, 2: 120, 3: 150 } as const;

// Create a VectorLayer for the given admin level.
// For level 1, uses selectedAdminRegion from state.
// For levels 2 and 3, uses country + parentCode to scope the query.
export function createAdminLayer(
  state: AdminLayerState,
  adminLevel: 1 | 2 | 3,
  country?: string,
  parentCode?: string,
): VectorLayer {
  const url =
    adminLevel === 1
      ? getAdminRegionUrl(state.selectedAdminRegion, 1)
      : getNestedAdminUrl(country!, parentCode!, adminLevel);

  const layer = new VectorLayer({
    source: new VectorSource({
      url,
      format: new GeoJSON(),
    }),
    style: (feature) => {
      const code = feature.get(COL_CODE);
      if (adminLevel === 3) {
        const affectedRegions = getAffectedRegionsForEvent(
          state.selectedEventId,
        );
        return styleAdmin3Region(
          code,
          state.selectedAdmin3Code,
          affectedRegions,
          state.isEventSelected,
        );
      }
      if (adminLevel === 2) {
        return styleAdmin2region(
          code,
          state.selectedAdmin2Code,
          state.animComplete,
          state.isEventSelected,
        );
      }
      return styleAdmin1region(
        code,
        state.selectedAdmin1Code,
        state.animComplete,
        state.isEventSelected,
      );
    },
  });

  layer.setZIndex(zIndexMap[adminLevel]);
  return layer;
}

// Handle a click on a map feature (admin region or event).
// Returns an object describing what happened so the caller can
// manage layers and animations.
export function handleFeatureClick(
  state: AdminLayerState,
  feature: FeatureLike,
  layer: BaseLayer,
  layers: {
    admin1: VectorLayer | null;
    admin2: VectorLayer | null;
    admin3: VectorLayer | null;
    event: VectorLayer | null;
  },
  selectedCountry: string,
  onSelect: (country: string, eventId: string) => void,
): { handled: boolean; showLevel?: 2 | 3; country?: string; parentCode?: string } {
  const properties = feature.getProperties();
  console.log("Clicked feature properties222:", properties);

  if (layer === layers.event) {
  }

  const newSelectedRegionCode = properties[COL_CODE] || noCountrySelectedValue;

  console.log(`>>>>2 ${state.isEventSelected}`);
  let processAdmin3Clicks = layer === layers.admin3;
  if (processAdmin3Clicks && state.isEventSelected) {
    const affectedRegions = getAffectedRegionsForEvent(state.selectedEventId);
    if (!affectedRegions.includes(newSelectedRegionCode)) {
      processAdmin3Clicks = false;
    }
  }

  // Clicked on admin3 layer
  if (processAdmin3Clicks) {
    console.log(`>>>>processAdmin3Clicks ${state.isEventSelected}`);
    state.selectedAdmin3Code = newSelectedRegionCode;
    layers.admin3?.changed();
    layers.admin2?.changed();
    layers.admin1?.changed();

    const geometry = feature.getGeometry?.();
    if (geometry) {
      state.animComplete = false;
      state.mapInstance?.getView().fit(geometry.getExtent(), {
        duration: 500,
        padding: [50, 50, 50, 50],
        callback: () => { state.animComplete = true; },
      });
    }
    return { handled: true };
  }

  console.log(`>>>>admin2 ${state.isEventSelected}`);
  // Clicked on admin2 layer
  if (layer === layers.admin2 && state.isEventSelected === false) {
    onSelect(
      properties[COL_COUNTRY] || "",
      state.selectedEventId,
    );

    state.selectedAdmin2Code = newSelectedRegionCode;
    layers.admin2?.changed();

    const country = properties[COL_COUNTRY] || selectedCountry;

    const geometry = feature.getGeometry?.();
    if (geometry) {
      state.animComplete = false;
      state.mapInstance?.getView().fit(geometry.getExtent(), {
        duration: 500,
        padding: [50, 50, 50, 50],
        callback: () => { state.animComplete = true; },
      });
    }
    return { handled: true, showLevel: 3, country, parentCode: newSelectedRegionCode };
  }

  console.log(`>>>>admin1 ${state.isEventSelected}`);
  // Clicked on admin1 layer
  if (layer === layers.admin1 && state.isEventSelected === false) {
    onSelect(
      properties[COL_COUNTRY] || "",
      state.selectedEventId,
    );

    state.selectedAdmin1Code = newSelectedRegionCode;
    layers.admin1?.changed();

    const country = properties[COL_COUNTRY] || selectedCountry;

    const geometry = feature.getGeometry?.();
    if (geometry) {
      state.animComplete = false;
      state.mapInstance?.getView().fit(geometry.getExtent(), {
        duration: 500,
        padding: [50, 50, 50, 50],
        callback: () => { state.animComplete = true; },
      });
    }
    return { handled: true, showLevel: 2, country, parentCode: newSelectedRegionCode };
  }

  state.selectedAdminRegion = newSelectedRegionCode;
  return { handled: true };
}
