import { useEffect, useRef } from "react";
import MapOl from "ol/Map.js";
import { View } from "ol";
import { fromLonLat } from "ol/proj";
import BaseLayer from "ol/layer/Base";
import { defaults as defaultControls } from "ol/control/defaults.js";
import { CountryData, noCountrySelectedValue } from "#utils/ibfMap";
import {
  showAdmin1Regions,
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
  onSelect: (country: string, adminLevel: number, regionCode: string) => void;
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

  const AffectedRegions = new Map([
    [
      "G5670",
      ["MW30703", "MW30707", "MW30708", "MW30704", "MW30706", "MW30705"],
    ],
    [
      "G1724",
      [
        "MW31104",
        "MW31106",
        "MW31105",
        "MW31107",
        "MW31120",
        "MW31108",
        "MW31109",
      ],
    ],
    ["G2001", ["MW31007", "MW31002", "MW31008", "MW31001"]],
    ["G5694", ["MW31011", "MW31004", "MW31005", "MW31020", "MW31006"]],
  ]);

  useEffect(() => {
    const state: AdminLayerState = {
      mapInstance: null,
      admin1Layer: null,
      admin2Layer: null,
      admin3Layer: null,
      selectedAdmin1Code: null,
      selectedAdmin2Code: null,
      selectedAdmin3Code: null,
      selectedAdminRegion: selectedCountry,
      selectedEventId: "",
      isEventSelected: false,
      animComplete: true,
      affectedRegions: AffectedRegions,
    };
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
      showAdmin1Regions(state);


      // Change cursor on hover
      mapInstanceRef.current.on("pointermove", (evt) => {
        const pixel = mapInstanceRef.current!.getEventPixel(evt.originalEvent);
        const hit = mapInstanceRef.current!.hasFeatureAtPixel(pixel, {
          layerFilter: (layer) =>
            layer === state.admin1Layer ||
            layer === state.admin2Layer ||
            layer === state.admin3Layer ||
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
            return handleFeatureClick(
              state,
              feature,
              layer,
              TODO_eventLayer,
              selectedCountry,
              onSelect,
            );
          },
          {
            layerFilter: (layer) =>
              layer === state.admin1Layer ||
              layer === state.admin2Layer ||
              layer === state.admin3Layer ||
              layer === TODO_eventLayer,
          },
        );
      });
    }

    return () => {
      if (state.admin3Layer) {
        mapInstanceRef.current?.removeLayer(state.admin3Layer);
        state.admin3Layer = null;
      }
      if (state.admin2Layer) {
        mapInstanceRef.current?.removeLayer(state.admin2Layer);
        state.admin2Layer = null;
      }
      if (state.admin1Layer) {
        mapInstanceRef.current?.removeLayer(state.admin1Layer);
        state.admin1Layer = null;
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
