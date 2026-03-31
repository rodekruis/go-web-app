import { useEffect, useRef } from "react";
import MapOl from "ol/Map.js";
import { View } from "ol";
import { fromLonLat } from "ol/proj";
import BaseLayer from "ol/layer/Base";
import { defaults as defaultControls } from "ol/control/defaults.js";
import { CountryData, noCountrySelectedValue } from "#utils/ibfMap";
import {
  createAdminLayer,
  handleFeatureClick,
  type AdminLayerState,
} from "#utils/ibfMapHandlers";
import { apply } from "ol-mapbox-style";
import styles from "./styles.module.css";
import VectorLayer from "ol/layer/Vector";

interface OlDataMapProps {
  // ISO_A2 code of the selected country
  selectedCountry: string;

  // StyleJson format vector tile map url
  mapStyleJsonUrl?: string;

  // Optional base map layer
  additionalVectorLayer?: BaseLayer;

  // Optional arg to expose adding a layer
  // It is a function that takes the add-layer function as an argument.
  addLayerFunction?: (addLayer: (layer: BaseLayer) => void) => void;

  // Callback for when a map item is selected.
  onSelect: (country: string, eventId: string) => void;
}

/**
 * OpenLayers map component for IBF data maps *
 * @returns A component that can be either standalone, or nested in a IbfMapContainer.
 */
export function OlDataMap({
  selectedCountry,
  additionalVectorLayer,
  mapStyleJsonUrl,
  addLayerFunction,
  onSelect,
}: OlDataMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapOl | null>(null);
  const legacy_countryInfo =
    selectedCountry === noCountrySelectedValue
      ? undefined
      : CountryData.get(selectedCountry);

  // Default center/zoom which is overridden if a country is selected.
  let center = [0, 0];
  let zoom = 2;

  let TODO_eventLayer: VectorLayer | null = null;

  useEffect(() => {
    const state: AdminLayerState = {
      mapInstance: null,
      selectedAdmin1Code: null,
      selectedAdmin2Code: null,
      selectedAdmin3Code: null,
      selectedAdminRegion: selectedCountry,
      selectedEventId: "",
      isEventSelected: false,
      animComplete: true
    };

    let admin1Layer: VectorLayer | null = null;
    let admin2Layer: VectorLayer | null = null;
    let admin3Layer: VectorLayer | null = null;

    function addAdminLayer(level: 1 | 2 | 3, country?: string, parentCode?: string) {
      // Remove layers at this level and below
      if (level <= 3 && admin3Layer) {
        mapInstanceRef.current?.removeLayer(admin3Layer);
        admin3Layer = null;
        state.selectedAdmin3Code = null;
      }
      if (level <= 2 && admin2Layer) {
        mapInstanceRef.current?.removeLayer(admin2Layer);
        admin2Layer = null;
        state.selectedAdmin2Code = null;
      }
      if (level <= 1 && admin1Layer) {
        mapInstanceRef.current?.removeLayer(admin1Layer);
        admin1Layer = null;
        state.selectedAdmin1Code = null;
      }

      const newLayer = createAdminLayer(state, level, country, parentCode);
      mapInstanceRef.current?.addLayer(newLayer);

      if (level === 1) admin1Layer = newLayer;
      else if (level === 2) admin2Layer = newLayer;
      else admin3Layer = newLayer;
    }
    if (mapRef.current && !mapInstanceRef.current) {
      // If a country is selected, center/zoom in on it.
      if (legacy_countryInfo) {
        center = fromLonLat([
          legacy_countryInfo.latlon[1],
          legacy_countryInfo.latlon[0],
        ]);
        zoom = legacy_countryInfo.initialZoom;
      }

      mapInstanceRef.current = new MapOl({
        target: mapRef.current,
        controls: defaultControls({ attribution: false }),

        view: legacy_countryInfo
          ? new View({
              center,
              zoom,
              // Constrain where the user can pan to
              extent: legacy_countryInfo.safeExtents,
              // The center of the country can't be panned off the view
              // Not using this can make it hard to get the edge of the map to the screen center
              constrainOnlyCenter: true,
            })
          : new View({
              center,
              zoom,
            }),
      });

      if (additionalVectorLayer) {
        // Ensure this layer is on top of the other map layers
        additionalVectorLayer.setZIndex(1000);
        mapInstanceRef.current.addLayer(additionalVectorLayer);
      }

      if (mapStyleJsonUrl) {
        apply(mapInstanceRef.current, mapStyleJsonUrl).catch((error: any) => {
          console.error("Style apply error:", error);
        });
      }

      // Expose addLayer function to parent
      if (addLayerFunction) {
        addLayerFunction((newLayer: BaseLayer) => {
          // Ensure layer appears above other layers
          newLayer.setZIndex(2000);
          mapInstanceRef.current?.addLayer(newLayer);
        });
      }

      state.mapInstance = mapInstanceRef.current;
      addAdminLayer(1);

      // Change cursor on hover
      mapInstanceRef.current.on("pointermove", (evt) => {
        const pixel = mapInstanceRef.current!.getEventPixel(evt.originalEvent);
        const hit = mapInstanceRef.current!.hasFeatureAtPixel(pixel, {
          layerFilter: (layer) =>
            layer === admin1Layer ||
            layer === admin2Layer ||
            layer === admin3Layer ||
            layer === TODO_eventLayer,
        });
        mapInstanceRef.current!.getTargetElement().style.cursor = hit
          ? "pointer"
          : "";
      });

      // Click handler
      mapInstanceRef.current.on("click", (evt) => {
        mapInstanceRef.current!.forEachFeatureAtPixel(
          evt.pixel,
          (feature, layer) => {
            const result = handleFeatureClick(
              state,
              feature,
              layer,
              { admin1: admin1Layer, admin2: admin2Layer, admin3: admin3Layer, event: TODO_eventLayer },
              selectedCountry,
              onSelect,
            );
            if (result.showLevel) {
              addAdminLayer(result.showLevel, result.country, result.parentCode);
            }
            return result.handled;
          },
          {
            layerFilter: (layer) =>
              layer === admin1Layer ||
              layer === admin2Layer ||
              layer === admin3Layer ||
              layer === TODO_eventLayer,
          },
        );
      });
    }

    return () => {
      if (admin3Layer) {
        mapInstanceRef.current?.removeLayer(admin3Layer);
        admin3Layer = null;
      }
      if (admin2Layer) {
        mapInstanceRef.current?.removeLayer(admin2Layer);
        admin2Layer = null;
      }
      if (admin1Layer) {
        mapInstanceRef.current?.removeLayer(admin1Layer);
        admin1Layer = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <div ref={mapRef} className={styles.map} />
    </div>
  );
}
