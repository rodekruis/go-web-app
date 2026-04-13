import { useCallback, useRef } from "react";
import BaseLayer from "ol/layer/Base";
import useAlert from "#hooks/useAlert";
import {
  makeEventImageLayer,
  makePopulationImageLayer,
} from "#utils/ibfMapHelpers";
import { MapLayerInfoType, MapLayerDisplayType, type MapLayerDetails } from "#utils/ibfMapTypes";

/**
 * Hook used to manage and share data for the IBF map components.
 *
 * Responsibilities:
 * - Load and cache data
 * - Create, cache, and toggle map data layers
 *
 * TODO: Change this to ISO_A3.
 * See task https://dev.azure.com/redcrossnl/IBF/_workitems/edit/41656
 * @param selectedCountry - ISO_A2 country code for country-specific layers
 */
export function useIbfDataLoader(selectedCountry: string) {
  const alert = useAlert();

  // Reference to the function (passed in by the map component) for adding layers to the map.
  const addLayerToMapFunction = useRef<((layer: BaseLayer, layerInfo: MapLayerDetails) => void) | null>(null);

  // Cache of all loaded layers.
  // The key is fixed based on the layer details.
  const layersCache = useRef(new Map<string, BaseLayer>());

  const _getLayerKey = (layerDetails: MapLayerDetails): string => {
    // Note: The resource ID may be empty for non-event layers, such as population.
    return `${layerDetails.dataType}_${selectedCountry}_${layerDetails.resourceId}`;
  }

  // Register the map's addLayer function.
  // Called by OlDataMap when the map is ready.
  const registerMapAddLayer = useCallback(
    (addLayer: (layer: BaseLayer, layerInfo: MapLayerDetails) => void) => {
      addLayerToMapFunction.current = addLayer;
    },
    []
  );

  // Internal function for handling layer toggling logic
  // If there is a cached layer, toggle it's visibility.
  // Otherwise, load it with the passed in loadLayer function.
  const _toggleLayer = async (key: string, layerDetails: MapLayerDetails, loadLayer: () => Promise<BaseLayer>) => {
    if (!addLayerToMapFunction.current) {
      console.error("[useIbfDataLoader] Map not ready");
      return;
    }

    const existing = layersCache.current.get(key);
    if (existing) {
      existing.setVisible(!existing.getVisible());
      return;
    }

    try {
      const layer = await loadLayer();
      layersCache.current.set(key, layer);
      addLayerToMapFunction.current(layer, layerDetails);
    } catch (error) {
      console.error(`[useIbfDataLoader] Failed to load layer ${key}:`, error);
      alert.show('Failed to load map layer', {
        variant: 'danger',
        description: 'The map layer could not be loaded. Please try again.',
      });
    }
  };

  // Exposed function to toggle a map layer
  // If the layer is not cached, it will be loaded.
  const toggleMapLayer = (layerDetails: MapLayerDetails) => {
    const { dataType, displayType, resourceId } = layerDetails;

    if (displayType === MapLayerDisplayType.Raster) {
      switch (dataType) {
        case MapLayerInfoType.Population:
          _toggleLayer(_getLayerKey(layerDetails), layerDetails, () =>
            makePopulationImageLayer(selectedCountry)
          );
          break;
        case MapLayerInfoType.EventExtent:
          _toggleLayer(_getLayerKey(layerDetails), layerDetails, () =>
            makeEventImageLayer(resourceId)
          );
          break;
        default:
          console.error(`[useIbfDataLoader] Unsupported layer type: ${dataType}`);
      }
    } else {
      // TODO: Handle other display types (Shape, Point, VectorTile)
      console.warn(`[useIbfDataLoader] Unsupported display type: ${displayType}`);
    }
  };

  // Set the visibility of all cached layers to false.
  const hideAllLayers = () => {
    for (const layer of layersCache.current.values()) {
      layer.setVisible(false);
    }
  };

  return {
    registerMapAddLayer,
    toggleMapLayer,
    hideAllLayers,
  };
}
