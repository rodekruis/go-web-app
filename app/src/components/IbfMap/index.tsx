import { useCallback, useMemo } from "react";
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
