import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "ol/ol.css";
import { OlDataMap } from "./OlDataMap";
import { IbfControlPanel } from "./IbfControlPanel";
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
import type { AllEventsData } from "#utils/ibfMapTypes";

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
  const [eventData, setEventData] = useState<AllEventsData>(() => {
    if (selectedEventId) {
      return getEventDetails(selectedEventId);
    }
    return getCurrentCountryEventData(selectedCountry);
  });

  const [selectedAdminPlaceCode, setSelectedAdminPlaceCode] = useState<string | null>(null);

  // Derive map details for the selected event (centroid, affected regions)
  const selectedEventMapDetails = useMemo(() => {
    const details = getSelectedEventMapDetails(eventData, selectedEventId || null);
    if (details && details.affectedRegionsByLevel.size === 0) {
      alert.show('No exposed regions', {
        variant: 'danger',
        description: `No exposed regions found for event "${selectedEventId}".`,
      });
    }
    return details;
  }, [eventData, selectedEventId, alert]);

  // Refresh page and put in a default start state
  const handleRefreshAll = () => {
    // Clear search params except for the country
    setSearchParams({
      [countryParamsKey]: selectedCountry,
    });

    // Reload event data and set it
    setEventData(getCurrentCountryEventData(selectedCountry));
  };

  // Handle event selection from control panel
  const handleEventClick = (eventId: string) => {
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
  
  // Data loader hook - manages layer loading and caching
  const {
    registerMapAddLayer,
    toggleMapLayer,
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
            onToggleMapLayer={toggleMapLayer}
            onHideAllLayers={hideAllLayers}
            countryCode={selectedCountry}
            selectedAdminPlaceCode={selectedAdminPlaceCode}
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
