import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "ol/ol.css";
import { OlDataMap } from "./OlDataMap";
import { IbfControlPanel } from "./IbfControlPanel";
import { IbfDataPanel } from "./IbfDataPanel";
import { useIbfDataLoader } from "./useIbfDataLoader";
import styles from "./styles.module.css";
import {
  countryParamsKey,
  mapUrlSimpleStyleJson,
  noCountrySelectedValue,
  eventIdParamsKey,
} from "#utils/ibfMap";
import { getCurrentCountryEventData, getEventDetails, type AllEventsData } from "#utils/ibfMapHelpers";

/**
 * Base map component for IBF data maps *
 * This component manages multiple nested components including for map data fetching, display, and control. *
 * @returns A standalone component
 */
export function IbfMapContainer() {
  // Search params are used to create a linkable state for the app so users can share links to specific views.
  const [searchParams, setSearchParams] = useSearchParams();

  // Load the view details from the search params
  // This is only done once at page load
  const selectedCountry = searchParams.get(countryParamsKey)?.toUpperCase() || noCountrySelectedValue;
  const selectedEventId = searchParams.get(eventIdParamsKey) || "";

  // Check if a country is in the search params
  if (selectedCountry === noCountrySelectedValue) {
    // TODO: add an error or redirect, since the portal requires a selected country.
    console.debug("[IbfMapContainer] No country selected");
  }

  // Event data is loaded once on page load, then only updated via refresh
  const [eventData, setEventData] = useState<AllEventsData>(() => {
    if (selectedEventId) {
      return getEventDetails(selectedEventId);
    }
    return getCurrentCountryEventData(selectedCountry);
  });

  // Handle event selection from control panel
  const handleEventClick = (eventId: string) => {
    // TODO: this will change map zoom, focus, etc.
    
    // Set search params for URL sharing only - does not reload data
      setSearchParams({
        [countryParamsKey]: selectedCountry,
        [eventIdParamsKey]: eventId,
      });
  };

  // Handle refresh all - clears event selection and reloads data
  const handleRefreshAll = () => {
    setSearchParams({
      [countryParamsKey]: selectedCountry,
    });
    setEventData(getCurrentCountryEventData(selectedCountry));
  };

  // Callback to update search params based on user interactions.
  const handleMapItemSelected = (eventId: string) => {
    // TODO: pass what is clicked on to the data panel and UI panel.    
    console.debug(`[IbfMap] Event selected: ${eventId}`);
  };
  
  // Data loader hook - manages layer loading and caching
  const {
    registerMapAddLayer,
    toggleFloodExtents,
    togglePopulation,
    hideAllLayers,
  } = useIbfDataLoader(selectedCountry);

  return (
    <div className={styles.container}>
      <IbfDataPanel selectedCountry={selectedCountry} />
      <div className={styles.mainContent}>
        <div className={styles.controlPanelColumn}>
          <IbfControlPanel
            eventData={eventData}
            onEventClick={handleEventClick}
            onRefreshAll={handleRefreshAll}
            onToggleFloodExtents={toggleFloodExtents}
            onTogglePopulation={togglePopulation}
            onHideAllLayers={hideAllLayers}
            countryCode={selectedCountry}
          />
        </div>
        <div className={styles.mapColumn}>
          <OlDataMap
            selectedCountry={selectedCountry}
            mapStyleJsonUrl={mapUrlSimpleStyleJson}
            addLayerFunction={registerMapAddLayer}
            onSelect={handleMapItemSelected}
          />
        </div>
      </div>
    </div>
  );
}
