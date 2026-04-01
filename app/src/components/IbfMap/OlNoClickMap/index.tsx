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
  styleAdmin3Region_clear,
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

const COL_COUNTRY = "country";
const COL_ADMIN_LEVEL = "admin_level";
const COL_NAME_EN = "name_en";
const COL_CODE = "code";

let animComplete = true;

// example of results:
// max size: 300kb
// .0005 = 279kb
// .001 = 188kb
// .05 = 53kb
// .01 = 30kb
let factor = 0.003;

const admin0Factor = 0.01;
const admin1Factor = 0.01;
const admin2Factor = 0.005;
const admin3Factor = 0.004;

// const glofasUriAll =  "http://localhost:9000/collections/debug.glofas_stations/items?limit=10000";
const glofasUriFilter =
  "http://localhost:9000/collections/debug.glofas_stations/items?filter=country%3D%27MWI%27";

//const borderUri_selected = `http://localhost:9000/collections/debug.admin_areas/items?filter=country=%27${cntry}%27%20AND%20admin_level=%27${admLevel}%27%20AND%20code%20LIKE%20%27${code}%25%27&limit=10000&transform=simplify,${factor}`;
const getAdminRegionUrl = (country: string, adm: number): string => {
  return `http://localhost:9000/collections/debug.admin_areas/items?filter=country=%27${country}%27%20AND%20admin_level=%27${adm}%27&limit=10000&transform=simplify,${factor}`;
};

const getNestedAdminUrl = (
  country: string,
  parentCode: string,
  adm: number,
): string => {
  return `http://localhost:9000/collections/debug.admin_areas/items?filter=country=%27${country}%27%20AND%20admin_level=%27${adm}%27%20AND%20code%20LIKE%20%27${parentCode}%25%27&limit=10000&transform=simplify,${factor}`;
};

/**
 * OpenLayers map component for IBF data maps *
 * @returns A component that can be either standalone, or nested in a IbfMapContainer.
 */
export function OlNoClickMap({
  selectedCountry,
  additionalVectorLayer,
  mapStyleJsonUrl,
  addLayerFunction,
  onSelect,
}: OlDataMapProps) {
  let selectedAdminRegion = selectedCountry;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapOl | null>(null);
  const legacy_countryInfo =
    selectedCountry === noCountrySelectedValue
      ? undefined
      : CountryData.get(selectedCountry);

  // Default center/zoom which is overridden if a country is selected.
  let center = [0, 0];
  let zoom = 2;

  let selectedAdmin1Code: string | null = null;
  let selectedAdmin2Code: string | null = null;
  let selectedAdmin3Code: string | null = null;

  let admin1Layer: VectorLayer | null = null;
  let admin2Layer: VectorLayer | null = null;
  let admin3Layer: VectorLayer | null = null;
  let glofasLayer: VectorLayer | null = null;

  /*
  ```
Clicked feature properties:
▸ {geometry: _Point, country: 'MWI', fid: 'G5670', id: 217, lat: -16.223, …}
Clicked GLOFAS station:
▸ {geometry: _Point, country: 'MWI', fid: 'G5670', id: 217, lat: -16.223, …}
Clicked feature properties:
▸ {geometry: _MultiPolygon, admin_level: 2, code: 'MW307', country: 'MW', id: 25948, …}
Clicked feature properties:
▸ {geometry: _Point, country: 'MWI', fid: 'G1724', id: 215, lat: -16.525, …}
Clicked GLOFAS station:
▸ {geometry: _Point, country: 'MWI', fid: 'G1724', id: 215, lat: -16.525, …}
Clicked feature properties:
▸ {geometry: _MultiPolygon, admin_level: 2, code: 'MW311', country: 'MW', id: 25942, …}
Clicked feature properties:
▸ {geometry: _Point, country: 'MWI', fid: 'G2001', id: 216, lat: -16.225, …}
Clicked GLOFAS station:
▸ {geometry: _Point, country: 'MWI', fid: 'G2001', id: 216, lat: -16.225, …}
Clicked feature properties:
▸ {geometry: _Point, country: 'MWI', fid: 'G5694', id: 218, lat: -16.025, …}
Clicked GLOFAS station:
▸ {geometry: _Point, country: 'MWI', fid: 'G5694', id: 218, lat: -16.025, …}
Clicked feature properties:
▸ {geometry: _MultiPolygon, admin_level: 2, code: 'MW310', country: 'MW', id: 25922, …}
```
  */

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
    // Show admin3 regions within a selected admin2 parent
    function showAdmin3Regions(country: string, parentCode: string): void {
      // Remove previous admin3 layer if exists
      if (admin3Layer) {
        mapInstanceRef.current?.removeLayer(admin3Layer);
      }

      // Reset selected admin3 when showing new admin3 regions
      selectedAdmin3Code = null;

      admin3Layer = new VectorLayer({
        source: new VectorSource({
          url: getNestedAdminUrl(country, parentCode, 3),
          format: new GeoJSON(),
        }),
        style: (feature) => {
          const code = feature.get(COL_CODE);
          const affectedRegion =
            glofasMapRegionCodes.get(selectedGlofasId) || null;
          return styleAdmin3Region_clear(
            code,
            selectedAdmin3Code,
            affectedRegion,
            isEventSelected,
          );
        },
      });

      // Ensure admin3 renders above admin2
      admin3Layer.setZIndex(150);
      mapInstanceRef.current?.addLayer(admin3Layer);
    }

    // Show admin2 regions within a selected admin1 parent
    function showAdmin2Regions(country: string, parentCode: string): void {
      // Remove previous admin2 and admin3 layers if they exist
      if (admin2Layer) {
        mapInstanceRef.current?.removeLayer(admin2Layer);
      }
      if (admin3Layer) {
        mapInstanceRef.current?.removeLayer(admin3Layer);
        admin3Layer = null;
      }

      // Reset selected admin2 and admin3 when showing new admin2 regions
      selectedAdmin2Code = null;
      selectedAdmin3Code = null;

      admin2Layer = new VectorLayer({
        source: new VectorSource({
          url: getNestedAdminUrl(country, parentCode, 2),
          format: new GeoJSON(),
        }),
        style: (feature) => {
          const code = feature.get(COL_CODE);
          return styleAdmin2region(
            code,
            selectedAdmin2Code,
            animComplete,
            isEventSelected,
          );
        },
      });

      // Ensure admin2 renders above admin1
      admin2Layer.setZIndex(120);
      mapInstanceRef.current?.addLayer(admin2Layer);
    }

    // Show admin1 regions (top level)
    function showAdmin1Regions(): void {
      // Remove previous admin1 layer if exists
      if (admin1Layer) {
        mapInstanceRef.current?.removeLayer(admin1Layer);
      }
      admin1Layer = new VectorLayer({
        source: new VectorSource({
          url: getAdminRegionUrl(selectedAdminRegion, 1),
          format: new GeoJSON(),
        }),
        style: (feature) => {
          const code = feature.get(COL_CODE);
          return styleAdmin1region(
            code,
            selectedAdmin1Code,
            animComplete,
            isEventSelected,
          );
        },
      });

      // Ensure admin1 renders above base map tiles
      admin1Layer.setZIndex(100);
      mapInstanceRef.current?.addLayer(admin1Layer);
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

      showAdmin1Regions();

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

      // Change cursor on hover
      mapInstanceRef.current.on("pointermove", (evt) => {
        const pixel = mapInstanceRef.current!.getEventPixel(evt.originalEvent);
        const hit = mapInstanceRef.current!.hasFeatureAtPixel(pixel, {
          layerFilter: (layer) =>
            layer === admin1Layer ||
            layer === admin2Layer ||
            layer === admin3Layer ||
            layer === glofasLayer,
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
            const properties = feature.getProperties();

            // debug: print all the properties of the clicked feature
            console.log("Clicked feature properties222:", properties);

            // Block clicking if admin 3 is selected. Clicking on the same admin 3 area though will
            // delect it and put user at admin 2 view with the zoom set to the admin 2 level.
            if (selectedAdmin3Code) {
              const clickedCode =
                properties[COL_CODE] || noCountrySelectedValue;
              if (layer === admin3Layer && clickedCode === selectedAdmin3Code) {
                selectedAdmin3Code = null;
                admin3Layer?.changed();

                // Zoom out to admin2 level
                mapInstanceRef.current?.getView().animate(
                  {
                    zoom: 10,
                    duration: 500,
                  },
                  () => {
                    animComplete = true;
                  },
                );
                return true;
              } else {
                return true;
              }
            }

            // Check if clicked on GLOFAS station
            if (layer === glofasLayer) {
              console.log("glofas clicked:", properties);
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

              // Set admin2 as selected
              const admin2Code = glofasMapAdmin2.get(selectedGlofasId);
              if (admin2Code) {
                // Derive admin1 code (first 3 chars, e.g., MW3 from MW307)
                const admin1Code = admin2Code.substring(0, 3);
                selectedAdmin1Code = admin1Code;
                admin1Layer?.changed();

                // Show admin2 regions for the admin1 parent
                showAdmin2Regions(selectedCountry, admin1Code);

                // Set admin2 as selected and show admin3
                selectedAdmin2Code = admin2Code;
                setTimeout(() => {
                  admin2Layer?.changed();
                  showAdmin3Regions(selectedCountry, admin2Code);

                  // Set admin3 as selected
                  const admin3Code = glofasMapAdmin3.get(selectedGlofasId);
                  if (admin3Code) {
                    //selectedAdmin3Code = admin3Code;
                    setTimeout(() => {
                      admin3Layer?.changed();
                    }, 500);
                  }
                }, 500);
              }
              return true;
            }

            // only process more if an event is selected
            if (!isEventSelected) {
              return false;
            }
            const newSelectedRegionCode =
              properties[COL_CODE] || noCountrySelectedValue;

            console.log(`>>>>2 ${isEventSelected}`);
            let processAdmin3Clicks = layer === admin3Layer;
            // If an event is selected, only allow selecting admin3 regions that are affected
            if (processAdmin3Clicks && isEventSelected) {
              const affectedRegions =
                glofasMapRegionCodes.get(selectedGlofasId) || [];
              if (!affectedRegions.includes(newSelectedRegionCode)) {
                processAdmin3Clicks = false;
              }
            }

            // Check if clicked on admin3 layer
            if (processAdmin3Clicks) {
              console.log(`>>>>processAdmin3Clicks ${isEventSelected}`);
              selectedAdmin3Code = newSelectedRegionCode;
              admin3Layer?.changed();
              admin2Layer?.changed();
              admin1Layer?.changed();

              // Zoom to admin3 region
              const geometry = feature.getGeometry();
              if (geometry) {
                const extent = geometry.getExtent();
                if (
                  extent[0] !== undefined &&
                  extent[1] !== undefined &&
                  extent[2] !== undefined &&
                  extent[3] !== undefined
                ) {
                  const center: [number, number] = [
                    (extent[0] + extent[2]) / 2,
                    (extent[1] + extent[3]) / 2,
                  ];
                  animComplete = false;
                  mapInstanceRef.current?.getView().animate(
                    {
                      center,
                      zoom: 12,
                      duration: 500,
                    },
                    () => {
                      animComplete = true;
                    },
                  );
                }
              }
              return true;
            }

            // this is not hit
            selectedAdminRegion = newSelectedRegionCode;

            return true;
          },
          {
            layerFilter: (layer) =>
              layer === admin1Layer ||
              layer === admin2Layer ||
              layer === admin3Layer ||
              layer === glofasLayer,
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
