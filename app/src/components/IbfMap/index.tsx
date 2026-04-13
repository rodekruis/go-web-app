import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "ol/ol.css";
import { OlDataMap } from "./OlDataMap";
import { IbfControlPanel } from "./IbfControlPanel";
import { IbfLayerPanel } from "./IbfLayerPanel";
import { IbfDataPanel } from "./IbfDataPanel";
import { useIbfDataLoader } from "./useIbfDataLoader";
import useAlert from "#hooks/useAlert";
import styles from "./styles.module.css";
import {
  countryParamsKey,
  noCountrySelectedValue,
  eventIdParamsKey,
} from "#utils/ibfMap";
import { getCurrentCountryEventData, getEventDetails, getSelectedEventMapDetails } from "#utils/ibfMapHelpers";

/**
 * Base map component for IBF data maps
 * This component manages multiple nested components including for map data fetching, display, and control.
 * @returns A standalone component
 */
export function IbfMapContainer() {
  const alert = useAlert();

  // Search params are used to create a shareable URL to a specific view.
  const [searchParams, setSearchParams] = useSearchParams();

  // Load the view details from the search params
  // This is only done once at page load
  const selectedCountry = searchParams.get(countryParamsKey)?.toUpperCase() || noCountrySelectedValue;
  const selectedEventId = searchParams.get(eventIdParamsKey) || "";

  // Check if a country is in the search params
  if (selectedCountry === noCountrySelectedValue) {
    console.error("No country selected. Cannot load the portal.");
    alert.show('No country selected', {
      variant: 'danger',
      description: 'A country must be selected to load the portal.',
    });
  }

  // Event data is loaded once on page load, then only updated via the refresh function
  const initialEventData = selectedEventId
    ? getEventDetails(selectedEventId)
    : getCurrentCountryEventData(selectedCountry);

  const [selectedAdminPlaceCode, setSelectedAdminPlaceCode] = useState<string | null>(null);

  // Data loader hook - manages layer loading, caching, and shared event state
  const {
    eventData,
    setEventData,
    selectedEventId: activeEventId,
    selectEvent,
    deselectEvent,
    selectedEventLayers,
    registerMapAddLayer,
    toggleMapLayer,
    hideAllLayers,
  } = useIbfDataLoader(selectedCountry, initialEventData, selectedEventId);

  // Derive map details for the selected event (centroid, affected regions)
  const selectedEventMapDetails = useMemo(() => {
    const details = getSelectedEventMapDetails(eventData, activeEventId);
    if (details && details.exposedRegionsByLevel.size === 0) {
      alert.show('No exposed regions', {
        variant: 'danger',
        description: `No exposed regions found for event "${activeEventId}".`,
      });
    }
    return details;
  }, [eventData, activeEventId, alert]);

  // Refresh page and put in a default start state
  const handleRefreshAll = () => {
    // Clear search params except for the country
    setSearchParams({
      [countryParamsKey]: selectedCountry,
    });

    // Deselect current event and admin areas
    deselectEvent();

    // Reload event data and set it
    setEventData(getCurrentCountryEventData(selectedCountry));
  };

  // Handle event selection from control panel
  const handleEventClick = (eventId: string) => {
    selectEvent(eventId);
    // Set search params for URL sharing only - does not reload data
      setSearchParams({
        [countryParamsKey]: selectedCountry,
        [eventIdParamsKey]: eventId,
      });
  };

  // Callback to update search params based on user interactions.
  const handleMapItemSelected = (placeCode: string) => {
    // TODO: pass what is clicked on to the data panel and UI panel.    
    setSelectedAdminPlaceCode(placeCode);
    console.debug(`[IbfMap] Admin area selected: ${placeCode}`);
  };
  
  
  return (
    <div className={styles.container}>
      <IbfDataPanel selectedCountry={selectedCountry} />
      <div className={styles.mainContent}>
        <div className={styles.controlPanelColumn}>
          <IbfControlPanel
            eventData={eventData}
            onEventClick={handleEventClick}
            onRefreshAll={handleRefreshAll}
            onDeselectEvent={deselectEvent}
            countryCode={selectedCountry}
            selectedAdminPlaceCode={selectedAdminPlaceCode}
          />
          <IbfLayerPanel
            eventLayers={selectedEventLayers}
            countryCode={selectedCountry}
            onToggleMapLayer={toggleMapLayer}
            onHideAllLayers={hideAllLayers}
          />
        </div>
        <div className={styles.mapColumn}>
          <OlDataMap
            selectedCountry={selectedCountry}
            selectedEventDetails={selectedEventMapDetails}
            addLayerFunction={registerMapAddLayer}
            onSelect={handleMapItemSelected}
          />
        </div>
      </div>
    </div>
  );
}
