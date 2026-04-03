import { useCallback, useRef } from "react";
import BaseLayer from "ol/layer/Base";
import {
  makeEventImageLayer,
  makePopulationImageLayer,
} from "#utils/ibfMapHelpers";

interface LayerCache {
  addLayerToMap: ((layer: BaseLayer) => void) | null;
  layers: Map<string, BaseLayer>;
}

/**
 * Hook to manage IBF map data layer loading and caching.
 *
 * Responsibilities:
 * - Cache loaded layers to avoid re-fetching
 * - Toggle layer visibility
 * - Connect to the OpenLayers map via registration callback
 *
 * @param selectedCountry - ISO_A2 country code for country-specific layers
 */
export function useIbfDataLoader(selectedCountry: string) {
  const cacheRef = useRef<LayerCache>({
    addLayerToMap: null,
    layers: new Map(),
  });

  /**
   * Register the map's addLayer function.
   * Called by OlDataMap when the map is ready.
   */
  const registerMapAddLayer = useCallback(
    (addLayer: (layer: BaseLayer) => void) => {
      cacheRef.current.addLayerToMap = addLayer;
    },
    []
  );

  /**
   * Toggle a layer by key. Loads it if not cached, toggles visibility if cached.
   */
  const toggleLayer = useCallback(
    async (key: string, loadLayer: () => Promise<BaseLayer>) => {
      const cache = cacheRef.current;

      if (!cache.addLayerToMap) {
        console.error("[useIbfDataLoader] Map not ready");
        return;
      }

      const existing = cache.layers.get(key);
      if (existing) {
        existing.setVisible(!existing.getVisible());
        return;
      }

      try {
        const layer = await loadLayer();
        cache.layers.set(key, layer);
        cache.addLayerToMap(layer);
      } catch (error) {
        console.error(`[useIbfDataLoader] Failed to load layer ${key}:`, error);
      }
    },
    []
  );

  /**
   * Toggle flood extents layer for a specific event.
   */
  const toggleFloodExtents = useCallback(
    (rasterImageId: string) => {
      toggleLayer(`flood_${rasterImageId}`, () =>
        makeEventImageLayer(rasterImageId)
      );
    },
    [toggleLayer]
  );

  /**
   * Toggle population layer for the selected country.
   */
  const togglePopulation = useCallback(() => {
    toggleLayer(`population_${selectedCountry}`, () =>
      makePopulationImageLayer(selectedCountry)
    );
  }, [toggleLayer, selectedCountry]);

  /**
   * Hide all loaded layers.
   */
  const hideAllLayers = useCallback(() => {
    for (const layer of cacheRef.current.layers.values()) {
      layer.setVisible(false);
    }
  }, []);

  return {
    registerMapAddLayer,
    toggleFloodExtents,
    togglePopulation,
    hideAllLayers,
  };
}
