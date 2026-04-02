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

function createView(countryInfo?: CountryData) {
  if (!countryInfo) {
    return new View({ center: [0, 0], zoom: 2 });
  }
  return new View({
    center: fromLonLat([countryInfo.latlon[1], countryInfo.latlon[0]]),
    zoom: countryInfo.initialZoom,
    extent: countryInfo.safeExtents,
    constrainOnlyCenter: true,
  });
}

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
  onSelect: (eventId: string) => void;
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

  let TODO_eventLayer: VectorLayer | null = null;

  useEffect(() => {
    const state: AdminLayerState = {
      mapInstance: null,
      selectedAdminCodes: new Map([[1, null], [2, null], [3, null]]),
      selectedAdminRegion: selectedCountry,
      selectedEventId: "",
      isEventSelected: false,
      animComplete: true
    };

    const adminLayers = new Map<number, VectorLayer>();

    function isInteractiveLayer(layer: BaseLayer) {
      return layer === TODO_eventLayer
        || adminLayers.get(1) === layer
        || adminLayers.get(2) === layer
        || adminLayers.get(3) === layer;
    }

    function addAdminLayer(level: 1 | 2 | 3, country?: string, parentCode?: string) {
      // Remove layers at this level and below
      for (let l = 3; l >= level; l--) {
        const existing = adminLayers.get(l);
        if (existing) {
          mapInstanceRef.current?.removeLayer(existing);
          adminLayers.delete(l);
          state.selectedAdminCodes.set(l, null);
        }
      }

      const newLayer = createAdminLayer(state, level, country, parentCode);
      mapInstanceRef.current?.addLayer(newLayer);
      adminLayers.set(level, newLayer);
    }
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new MapOl({
        target: mapRef.current,
        controls: defaultControls({ attribution: false }),
        view: createView(legacy_countryInfo),
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
          layerFilter: isInteractiveLayer,
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
              adminLayers,
              TODO_eventLayer,
              selectedCountry,
              onSelect,
            );
            if (result.showLevel) {
              addAdminLayer(result.showLevel, result.country, result.parentCode);
            }
            return result.handled;
          },
          {
            layerFilter: isInteractiveLayer,
          },
        );
      });
    }

    return () => {
      for (const [, layer] of adminLayers) {
        mapInstanceRef.current?.removeLayer(layer);
      }
      adminLayers.clear();
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
