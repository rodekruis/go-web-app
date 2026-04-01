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
  getAffectedRegionsForEvent,
  COL_CODE,
  COL_COUNTRY,
} from "./ibfMapHelpers";
import {
  styleAdmin1region,
  styleAdmin2region,
  styleAdmin3Region,
} from "./ibfMapStyles";

// Fit the map view to a feature's geometry with animation
function fitToFeature(state: AdminLayerState, feature: FeatureLike) {
  const geometry = feature.getGeometry?.();
  if (!geometry) return;
  state.animComplete = false;
  state.mapInstance?.getView().fit(geometry.getExtent(), {
    duration: 500,
    padding: [50, 50, 50, 50],
    callback: () => { state.animComplete = true; },
  });
}

export interface AdminLayerState {
  mapInstance: MapOl | null;
  selectedAdminCodes: Map<number, string | null>;
  selectedAdminRegion: string;
  selectedEventId: string;
  isEventSelected: boolean;
  animComplete: boolean;
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
          state.selectedAdminCodes.get(3) ?? null,
          affectedRegions,
          state.isEventSelected,
        );
      }
      if (adminLevel === 2) {
        return styleAdmin2region(
          code,
          state.selectedAdminCodes.get(2) ?? null,
          state.animComplete,
          state.isEventSelected,
        );
      }
      return styleAdmin1region(
        code,
        state.selectedAdminCodes.get(1) ?? null,
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
  adminLayers: Map<number, VectorLayer>,
  eventLayer: VectorLayer | null,
  selectedCountry: string,
  onSelect: (country: string, eventId: string) => void,
): { handled: boolean; showLevel?: 2 | 3; country?: string; parentCode?: string } {
  const properties = feature.getProperties();
  console.log("Clicked feature properties222:", properties);

  if (layer === eventLayer) {
  }

  const newSelectedRegionCode = properties[COL_CODE] || noCountrySelectedValue;

  console.log(`>>>>2 ${state.isEventSelected}`);
  let processAdmin3Clicks = layer === adminLayers.get(3);
  if (processAdmin3Clicks && state.isEventSelected) {
    const affectedRegions = getAffectedRegionsForEvent(state.selectedEventId);
    if (!affectedRegions.includes(newSelectedRegionCode)) {
      processAdmin3Clicks = false;
    }
  }

  // Clicked on admin3 layer
  if (processAdmin3Clicks) {
    console.log(`>>>>processAdmin3Clicks ${state.isEventSelected}`);
    state.selectedAdminCodes.set(3, newSelectedRegionCode);
    for (const l of adminLayers.values()) l.changed();

    fitToFeature(state, feature);
    return { handled: true };
  }

  console.log(`>>>>admin2 ${state.isEventSelected}`);
  // Clicked on admin2 layer
  if (layer === adminLayers.get(2) && state.isEventSelected === false) {
    onSelect(
      properties[COL_COUNTRY] || "",
      state.selectedEventId,
    );

    state.selectedAdminCodes.set(2, newSelectedRegionCode);
    adminLayers.get(2)?.changed();

    const country = properties[COL_COUNTRY] || selectedCountry;

    fitToFeature(state, feature);
    return { handled: true, showLevel: 3, country, parentCode: newSelectedRegionCode };
  }

  console.log(`>>>>admin1 ${state.isEventSelected}`);
  // Clicked on admin1 layer
  if (layer === adminLayers.get(1) && state.isEventSelected === false) {
    onSelect(
      properties[COL_COUNTRY] || "",
      state.selectedEventId,
    );

    state.selectedAdminCodes.set(1, newSelectedRegionCode);
    adminLayers.get(1)?.changed();

    const country = properties[COL_COUNTRY] || selectedCountry;

    fitToFeature(state, feature);
    return { handled: true, showLevel: 2, country, parentCode: newSelectedRegionCode };
  }

  state.selectedAdminRegion = newSelectedRegionCode;
  return { handled: true };
}
