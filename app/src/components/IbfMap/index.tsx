import { useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import BaseLayer from "ol/layer/Base";
import "ol/ol.css";
import { OlDataMap } from "./OlDataMap";
import { IbfControlPanel } from "./IbfControlPanel";
import { IbfDataPanel } from "./IbfDataPanel";
import styles from "./styles.module.css";
import {
  countryParamsKey,
  mapUrlSimpleStyleJson,
  noCountrySelectedValue,
  eventIdParamsKey,
} from "#utils/ibfMap";
import { getEventData, makeEventImageLayer, makePopulationImageLayer, type AllEventsData } from "#utils/ibfMapHelpers";

/**
 * Base map component for IBF data maps *
 * This component manages multiple nested components including for map data fetching, display, and control. *
 * @returns A standalone component
 */
export function IbfMapContainer() {

  // Load the country from the search params
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCountry =
    searchParams.get(countryParamsKey)?.toUpperCase() ||
    noCountrySelectedValue;

  // Load event data once on page load (memoized by country)
  const eventData: AllEventsData = useMemo(
    () => getEventData(selectedCountry),
    [selectedCountry]
  );

  // Handle event selection from control panel
  const handleEventClick = useCallback((eventId: string) => {
    console.debug(`[IbfMap] Event selected: ${eventId}`);
  }, []);

  // Callback to update search params based on user interactions.
  const handleMapItemSelected = useCallback(
    (eventId: string) => {
      if (eventId) {
        setSearchParams({
          [countryParamsKey]: selectedCountry,
          [eventIdParamsKey]: eventId,
        });
      } else {
        setSearchParams({});
      }
    },
    [],
  );



  // Shared data state for map layers and cached data
  const dataStateRef = useRef({
    // Function to add a layer to the map (set by OlDataMap when ready)
    addLayerFunction: null as ((layer: BaseLayer) => void) | null,
    // Cache of loaded image layers by key
    imageLayers: new Map<string, BaseLayer>(),
  });

  const addDataLayer = useCallback((addLayer: (layer: BaseLayer) => void) => {
    dataStateRef.current.addLayerFunction = addLayer;
  }, []);

  // Toggle a layer by key - loads if not cached, toggles visibility if cached
  const toggleLayer = useCallback(async (
    key: string,
    loadLayer: () => Promise<BaseLayer>
  ) => {
    if (!dataStateRef.current.addLayerFunction) {
      console.error("Map not ready yet");
      return;
    }

    const cachedLayer = dataStateRef.current.imageLayers.get(key);
    if (cachedLayer) {
      cachedLayer.setVisible(!cachedLayer.getVisible());
      return;
    }

    try {
      const layer = await loadLayer();
      dataStateRef.current.imageLayers.set(key, layer);
      dataStateRef.current.addLayerFunction(layer);
    } catch (error) {
      console.error(`Error loading layer ${key}:`, error);
    }
  }, []);

  const handleToggleFloodExtents = useCallback((rasterImageId: string) => {
    toggleLayer(`flood_${rasterImageId}`, () => makeEventImageLayer(rasterImageId));
  }, [toggleLayer]);

  const handleTogglePopulation = useCallback(() => {
    toggleLayer(`population_${selectedCountry}`, () => makePopulationImageLayer(selectedCountry));
  }, [toggleLayer, selectedCountry]);

  const hideAllLayers = useCallback(() => {
    for (const layer of dataStateRef.current.imageLayers.values()) {
      layer.setVisible(false);
    }
  }, []);



  return (
    <div className={styles.container}>
      <IbfDataPanel selectedCountry={selectedCountry} />
      <div className={styles.mainContent}>
        <div className={styles.controlPanelColumn}>
          <IbfControlPanel
            eventData={eventData}
            onEventClick={handleEventClick}
            onToggleFloodExtents={handleToggleFloodExtents}
            onTogglePopulation={handleTogglePopulation}
            onHideAllLayers={hideAllLayers}
            countryCode={selectedCountry}
          />
        </div>
        <div className={styles.mapColumn}>
          <OlDataMap
            selectedCountry={selectedCountry}
            mapStyleJsonUrl={mapUrlSimpleStyleJson}
            addLayerFunction={addDataLayer}
            onSelect={handleMapItemSelected}
          />
        </div>
      </div>
    </div>
  );
}
