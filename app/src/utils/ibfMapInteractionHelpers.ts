// Helpers for map interactions, including admin areas,
// since these are the main interactive feature on the map,

import MapOl from "ol/Map.js";
import { FeatureLike } from "ol/Feature";
import BaseLayer from "ol/layer/Base";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON";
import {
  noCountrySelectedValue,
  PLACE_CODE_FIELD_KEY,
  COUNTRY_FIELD_KEY,
} from "./ibfMap";
import {
  getAdminRegionUrl,
  getNestedAdminUrl,
  getAdminAreaZIndex,
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
  state.mapInstance?.getView().fit(geometry.getExtent(), {
    duration: 500,
    padding: [50, 50, 50, 50],
  });
}

export interface AdminLayerState {
  mapInstance: MapOl | null;
  // Selected codes by level: 1/2/3 = admin levels
  // TODO: support variable max admin levels (2,3 or 4) for here and throughout the code
  selectedAdminCodes: Map<number, string | null>;
  selectedEventId: string;
  isEventSelected: boolean;
  // Affected region codes by admin level. This is populated when an event is selected.
  exposedRegionsByLevel: Map<number, string[]>;
}

// Create a VectorLayer for the given admin level.
export function createAdminLayer(
  state: AdminLayerState,
  adminLevel: 1 | 2 | 3,
  country?: string,
  parentCode?: string,
): VectorLayer {
  // Create the admin area url.
  // Admin level 1 has a different format than nested admin levels.
  const url =
    adminLevel === 1
      ? getAdminRegionUrl(country ?? '', 1)
      : getNestedAdminUrl(country!, parentCode!, adminLevel);

  const layer = new VectorLayer({
    source: new VectorSource({
      url,
      format: new GeoJSON(),
    }),
    style: (feature) => {
      const code = feature.get(PLACE_CODE_FIELD_KEY);
      if (adminLevel === 3) {
        const affectedRegions = state.exposedRegionsByLevel.get(3) ?? [];

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
          state.isEventSelected,
        );
      }
      return styleAdmin1region(
        code,
        state.selectedAdminCodes.get(1) ?? null,
        state.isEventSelected,
      );
    },
  });

  layer.setZIndex(getAdminAreaZIndex(adminLevel));
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
  onSelect: (placeCode: string) => void,
): { handled: boolean; showLevel?: 2 | 3; country?: string; parentCode?: string } {
  const properties = feature.getProperties();

  // Print out all features of the item clicked on.
  // Use only for DEV builds.
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("Clicked feature properties:", properties);
  }

  if (layer === eventLayer) {
    // TODO: handle event layer interaction when they are added to the map.
  }

  const newSelectedRegionCode = properties[PLACE_CODE_FIELD_KEY] || noCountrySelectedValue;

  let processAdmin3Clicks = layer === adminLayers.get(3);
  if (processAdmin3Clicks && state.isEventSelected) {
    const affectedRegions = state.exposedRegionsByLevel.get(3) ?? [];
    if (!affectedRegions.includes(newSelectedRegionCode)) {
      processAdmin3Clicks = false;
    }
  }

  // Clicked on admin3 layer
  if (processAdmin3Clicks) {
    onSelect(newSelectedRegionCode);
    state.selectedAdminCodes.set(3, newSelectedRegionCode);
    for (const l of adminLayers.values()) l.changed();

    fitToFeature(state, feature);
    return { handled: true };
  }

  // Clicked on admin2 layer
  if (layer === adminLayers.get(2) && state.isEventSelected === false) {
    onSelect(newSelectedRegionCode);

    state.selectedAdminCodes.set(2, newSelectedRegionCode);
    adminLayers.get(2)?.changed();

    const country = properties[COUNTRY_FIELD_KEY] || selectedCountry;

    fitToFeature(state, feature);
    return { handled: true, showLevel: 3, country, parentCode: newSelectedRegionCode };
  }

  // Clicked on admin1 layer
  if (layer === adminLayers.get(1) && state.isEventSelected === false) {
    onSelect(newSelectedRegionCode);

    state.selectedAdminCodes.set(1, newSelectedRegionCode);
    adminLayers.get(1)?.changed();

    const country = properties[COUNTRY_FIELD_KEY] || selectedCountry;

    fitToFeature(state, feature);
    return { handled: true, showLevel: 2, country, parentCode: newSelectedRegionCode };
  }

  state.selectedAdminCodes.set(0, newSelectedRegionCode);
  return { handled: true };
}
