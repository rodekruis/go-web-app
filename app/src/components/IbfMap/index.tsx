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
import { getEventData, type AllEventsData } from "#utils/ibfMapHelpers";

/**
 * Base map component for IBF data maps *
 * This component manages multiple nested components including for map data fetching, display, and control. *
 * @returns A standalone component
 */
export function IbfMapContainer() {
  // Load the country from the search params
  // This is only done once at page load
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCountry =
    searchParams.get(countryParamsKey)?.toUpperCase() || noCountrySelectedValue;

  // Fetch the current latest event data once at first page load
  const eventData: AllEventsData = getEventData(selectedCountry);

  // Handle event selection from control panel
  const handleEventClick = (eventId: string) => {
    // TODO: this will change map zoom, focus, etc.
    console.debug(`[IbfMap] Event selected: ${eventId}`);
  };

  // Callback to update search params based on user interactions.
  const handleMapItemSelected = (eventId: string) => {
    // TODO: pass what is clicked on to the data panel and UI panel.

    // Set search params.
    // TODO: set more values in the search params
    if (eventId) {
      setSearchParams({
        [countryParamsKey]: selectedCountry,
        [eventIdParamsKey]: eventId,
      });
    } else {
      setSearchParams({
        [countryParamsKey]: selectedCountry,
        [eventIdParamsKey]: "",
      });
    }
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
