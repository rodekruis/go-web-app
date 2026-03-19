import { useEffect, useRef } from "react";
import MapOl from "ol/Map.js";
import { View } from "ol";
import { fromLonLat } from "ol/proj";
import BaseLayer from "ol/layer/Base";
import { defaults as defaultControls } from "ol/control/defaults.js";
import { CountryData, noCountrySelectedValue } from "#utils/ibfMap";
import {
  styleAdmin1region,
  styleAdmin2region,
  styleAdmin3Region,
  styleGlofasStation,
} from "#utils/ibfMapStyles";
import { apply } from "ol-mapbox-style";
import styles from "./styles.module.css";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON";

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

const COL_CODE = "code";

let animComplete = true;

// Simplification factor for admin boundaries
const factor = 0.003;

// const glofasUriAll =  "http://localhost:9000/collections/public.glofas_stations/items?limit=10000";
const glofasUriFilter =
  "http://localhost:9000/collections/public.glofas_stations/items?filter=country%3D%27MWI%27";

const getAdminRegionUrl = (country: string, adm: number): string => {
  return `http://localhost:9000/collections/public.admin_boundaries/items?filter=country=%27${country}%27%20AND%20admin_level=%27${adm}%27&limit=10000&transform=simplify,${factor}`;
};

/**
 * OpenLayers map component for IBF data maps *
 * @returns A component that can be either standalone, or nested in a IbfMapContainer.
 */
export function OlZoomMap({
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

  let selectedAdmin3Code: string | null = null;

  let admin1Layer: VectorLayer | null = null;
  let admin2Layer: VectorLayer | null = null;
  let admin3Layer: VectorLayer | null = null;
  let glofasLayer: VectorLayer | null = null;

  let isEventSelected = false;

  const glofasMapAdmin2 = new Map([
    ["G5670", "MW307"],
    ["G1724", "MW311"],
    ["G2001", "MW310"],
    ["G5694", "MW310"],
  ]);

  const glofasMapAdmin3 = new Map([
    ["G5670", "MW30703"],
    ["G1724", "MW31104"],
    ["G2001", "MW31007"],
    ["G5694", "MW31011"],
  ]);

  const glofasMapRegionCodes = new Map([
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

  let selectedGlofasId = "";

  useEffect(() => {
    // Update layer visibility based on zoom level
    function updateLayerVisibility(currentZoom: number): void {
      if (admin1Layer && admin2Layer && admin3Layer) {
        admin1Layer.setVisible(currentZoom < 7 && !isEventSelected);
        admin2Layer.setVisible(currentZoom >= 7 && currentZoom < 9 && !isEventSelected);
        admin3Layer.setVisible(currentZoom >= 9 || isEventSelected);
      }
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

      // Create all admin layers
      admin1Layer = new VectorLayer({
        source: new VectorSource({
          url: getAdminRegionUrl(selectedCountry, 1),
          format: new GeoJSON(),
        }),
        style: (feature) => {
          const code = feature.get(COL_CODE);
          return styleAdmin1region(code, null, animComplete, isEventSelected);
        },
      });
      admin1Layer.setZIndex(100);
      mapInstanceRef.current.addLayer(admin1Layer);

      admin2Layer = new VectorLayer({
        source: new VectorSource({
          url: getAdminRegionUrl(selectedCountry, 2),
          format: new GeoJSON(),
        }),
        style: (feature) => {
          const code = feature.get(COL_CODE);
          return styleAdmin2region(code, null, animComplete, isEventSelected);
        },
      });
      admin2Layer.setZIndex(120);
      mapInstanceRef.current.addLayer(admin2Layer);

      admin3Layer = new VectorLayer({
        source: new VectorSource({
          url: getAdminRegionUrl(selectedCountry, 3),
          format: new GeoJSON(),
        }),
        style: (feature) => {
          const code = feature.get(COL_CODE);
          const affectedRegion =
            glofasMapRegionCodes.get(selectedGlofasId) || null;
          return styleAdmin3Region(
            code,
            selectedAdmin3Code,
            affectedRegion,
            isEventSelected,
          );
        },
      });
      admin3Layer.setZIndex(150);
      mapInstanceRef.current.addLayer(admin3Layer);

      // Set initial visibility based on current zoom
      const initialZoom = mapInstanceRef.current.getView().getZoom() || zoom;
      updateLayerVisibility(initialZoom);

      // Listen for zoom changes
      mapInstanceRef.current.getView().on("change:resolution", () => {
        const currentZoom = mapInstanceRef.current?.getView().getZoom() || 0;
        updateLayerVisibility(currentZoom);
      });

      // Add GLOFAS stations layer
      glofasLayer = new VectorLayer({
        source: new VectorSource({
          url: glofasUriFilter,
          format: new GeoJSON(),
        }),
        style: styleGlofasStation,
      });
      glofasLayer.setZIndex(200);
      mapInstanceRef.current.addLayer(glofasLayer);

      // Change cursor on hover for GLOFAS stations only
      mapInstanceRef.current.on("pointermove", (evt) => {
        const pixel = mapInstanceRef.current!.getEventPixel(evt.originalEvent);
        const hit = mapInstanceRef.current!.hasFeatureAtPixel(pixel, {
          layerFilter: (layer) => layer === glofasLayer,
        });
        mapInstanceRef.current!.getTargetElement().style.cursor = hit
          ? "pointer"
          : "";
      });

      // Click handler for GLOFAS stations only
      mapInstanceRef.current.on("click", (evt) => {
        mapInstanceRef.current!.forEachFeatureAtPixel(
          evt.pixel,
          (feature, layer) => {
            // Only handle GLOFAS station clicks
            if (layer !== glofasLayer) {
              return false;
            }

            const properties = feature.getProperties();
            console.log("GLOFAS station clicked:", properties);

            selectedGlofasId = properties.fid;
            isEventSelected = true;

            // Zoom to station location
            const stationLat = properties.lat;
            const stationLon = properties.lon;
            if (stationLat && stationLon) {
              const stationCoords = fromLonLat([stationLon, stationLat]);
              animComplete = false;
              mapInstanceRef.current?.getView().animate(
                {
                  center: stationCoords,
                  zoom: 10,
                  duration: 500,
                },
                () => {
                  animComplete = true;
                },
              );
            }

            // Set admin3 as selected based on GLOFAS mapping
            const admin3Code = glofasMapAdmin3.get(selectedGlofasId);
            if (admin3Code) {
              selectedAdmin3Code = admin3Code;
            }

            // Refresh all admin layers to update styles
            admin1Layer?.changed();
            admin2Layer?.changed();
            admin3Layer?.changed();

            // Call onSelect with the admin2 info
            const admin2Code = glofasMapAdmin2.get(selectedGlofasId);
            if (admin2Code) {
              onSelect(selectedCountry, 2, admin2Code);
            }

            return true;
          },
          {
            layerFilter: (layer) => layer === glofasLayer,
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
