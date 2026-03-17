import { useEffect, useRef } from "react";
import Map from "ol/Map.js";
import { View } from "ol";
import { fromLonLat } from "ol/proj";
import BaseLayer from "ol/layer/Base";
import { defaults as defaultControls } from "ol/control/defaults.js";
import { CountryData, noCountrySelectedValue } from "#utils/ibfMap";
import { apply } from "ol-mapbox-style";
import styles from "./styles.module.css";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
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

const COL_COUNTRY = "country";
const COL_ADMIN_LEVEL = "admin_level";
const COL_NAME_EN = "name_en";
const COL_CODE = "code";

// example of results:
// max size: 300kb
// .0005 = 279kb
// .001 = 188kb
// .05 = 53kb
// .01 = 30kb
let factor = 0.01;

const admin0Factor = 0.01;
const admin1Factor = 0.01;
const admin2Factor = 0.005;
const admin3Factor = 0.004;

const glofasUriAll =
  "http://localhost:9000/collections/public.glofas_stations/items?limit=10000";
const glofasUriFilter =
  "http://localhost:9000/collections/public.glofas_stations/items?filter=country%3D%27ETH%27";

  let admLevel = 2;
  let cntry = "MW";
  let code = "MW2";
const borderUri_code = `http://localhost:9000/collections/public.admin_boundaries/items?filter=country=%27${cntry}%27%20AND%20code=%27${code}%27&limit=10000&transform=simplify,${factor}`;
const borderUri = `http://localhost:9000/collections/public.admin_boundaries/items?filter=country=%27${cntry}%27%20AND%20admin_level=%27${admLevel}%27&limit=10000&transform=simplify,${factor}`;
// _2
/**
 * OpenLayers map component for IBF data maps *
 * @returns A component that can be either standalone, or nested in a IbfMapContainer.
 */
export function OlDataMap({
  selectedCountry: selectedAdminRegion,
  additionalVectorLayer,
  mapStyleJsonUrl,
  addLayerFunction,
  onSelect,
}: OlDataMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const legacy_countryInfo =
    selectedAdminRegion === noCountrySelectedValue
      ? undefined
      : CountryData.get(selectedAdminRegion);

  // Default center/zoom which is overridden if a country is selected.
  let center = [0, 0];
  let zoom = 2;

  let adminLevel = 1;
  
  let bordersLayer: VectorLayer | null = null;

  useEffect(() => {
    function showAdminRegions(): void {
      if (adminLevel === 1) {
        // Remove previous layer if exists
        if (bordersLayer) {
          mapInstanceRef.current?.removeLayer(bordersLayer);
        }
        bordersLayer = new VectorLayer({
          source: new VectorSource({
            url: borderUri,
            format: new GeoJSON(),
          }),
          style: new Style({
            fill: new Fill({
              color: "rgba(87, 152, 227, 0.84)",
            }),
            stroke: new Stroke({
              color: "#fc1de6",
              width: 1,
            }),
          }),
        });

        // Ensure borders render above base map tiles
        bordersLayer.setZIndex(100);
        mapInstanceRef.current?.addLayer(bordersLayer);
      } else {
        // Remove borders layer
        if (bordersLayer) {
          mapInstanceRef.current?.removeLayer(bordersLayer);
          bordersLayer = null;
        }
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

      mapInstanceRef.current = new Map({
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
          mapInstanceRef.current?.addLayer(newLayer);
        });
      }

      showAdminRegions();

      // Change cursor on hover (borders layer only)
      mapInstanceRef.current.on("pointermove", (evt) => {
        const pixel = mapInstanceRef.current!.getEventPixel(evt.originalEvent);
        const hit = mapInstanceRef.current!.hasFeatureAtPixel(pixel, {
          layerFilter: (layer) => layer === bordersLayer,
        });
        mapInstanceRef.current!.getTargetElement().style.cursor = hit
          ? "pointer"
          : "";
      });

      // Click handler (borders layer only)
      mapInstanceRef.current.on("click", (evt) => {
        mapInstanceRef.current!.forEachFeatureAtPixel(evt.pixel, (feature) => {
          const properties = feature.getProperties();

          // debug: print all the properties of the clicked feature
          console.log("Clicked feature properties:", properties);

          const newSelectedRegionCode =
            properties[COL_CODE] || noCountrySelectedValue;
          const newAdminLevel = properties[COL_ADMIN_LEVEL] || 0;

          if (selectedAdminRegion !== newSelectedRegionCode) {
            onSelect(
              properties[COL_COUNTRY] || "",
              newAdminLevel,
              newSelectedRegionCode,
            );

            // Change layer to show the next admin level down
            // Set zoom and extents
            // TODO

            adminLevel = newAdminLevel;
          } else {
            // deselect
            // how will this be hit?
            onSelect(noCountrySelectedValue, 0, "");
          }

          selectedAdminRegion = newSelectedRegionCode;

          return true;
        }, {
          layerFilter: (layer) => layer === bordersLayer,
        });
      });
    }

    return () => {
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
