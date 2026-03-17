import { useEffect, useRef } from "react";
import MapOl from "ol/Map.js";
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
import Circle from "ol/style/Circle";
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

const glofasUriAll =
  "http://localhost:9000/collections/public.glofas_stations/items?limit=10000";
const glofasUriFilter =
  "http://localhost:9000/collections/public.glofas_stations/items?filter=country%3D%27MWI%27";

  let admLevel = 2;
  let cntry = "MW";
  let code = "MW2";
const borderUri_selected = `http://localhost:9000/collections/public.admin_boundaries/items?filter=country=%27${cntry}%27%20AND%20admin_level=%27${admLevel}%27%20AND%20code%20LIKE%20%27${code}%25%27&limit=10000&transform=simplify,${factor}`;
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
  const mapInstanceRef = useRef<MapOl | null>(null);
  const legacy_countryInfo =
    selectedAdminRegion === noCountrySelectedValue
      ? undefined
      : CountryData.get(selectedAdminRegion);

  // Default center/zoom which is overridden if a country is selected.
  let center = [0, 0];
  let zoom = 2;

  let adminLevel = 1;
  let selectedCode: string | null = null;
  let selectedChildCode: string | null = null;
  
  let bordersLayer: VectorLayer | null = null;
  let childBordersLayer: VectorLayer | null = null;
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

  useEffect(() => {
    function showChildAdminRegions(country: string, parentCode: string, parentAdminLevel: number): void {
      // Remove previous child layer if exists
      if (childBordersLayer) {
        mapInstanceRef.current?.removeLayer(childBordersLayer);
      }

      const childAdminLevel = parentAdminLevel + 1;
      const childBorderUri = `http://localhost:9000/collections/public.admin_boundaries/items?filter=country=%27${country}%27%20AND%20admin_level=%27${childAdminLevel}%27%20AND%20code%20LIKE%20%27${parentCode}%25%27&limit=10000&transform=simplify,${factor}`;

      // Reset selected child when showing new child regions
      selectedChildCode = null;

      childBordersLayer = new VectorLayer({
        source: new VectorSource({
          url: childBorderUri,
          format: new GeoJSON(),
        }),
        style: (feature) => {
          const code = feature.get(COL_CODE);
          // Highlight selected child region in orange
          if (code === selectedChildCode) {
            return new Style({
              fill: new Fill({
                color: "rgba(255, 152, 0, 0.7)",
              }),
              stroke: new Stroke({
                color: "#e65100",
                width: 2,
              }),
            });
          }
          return new Style({
            fill: new Fill({
              color: "rgba(76, 175, 80, 0.6)",
            }),
            stroke: new Stroke({
              color: "#2e7d32",
              width: 1,
            }),
          });
        },
      });

      // Ensure child borders render above parent borders
      childBordersLayer.setZIndex(150);
      mapInstanceRef.current?.addLayer(childBordersLayer);
    }

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
          style: (feature) => {
            const code = feature.get(COL_CODE);
            // Don't fill the selected region
            if (code === selectedCode && animComplete) {
              return new Style({
                stroke: new Stroke({
                  color: "#fc1de6",
                  width: 1,
                }),
              });
            }
            return new Style({
              fill: new Fill({
                color: "rgba(87, 152, 227, 0.84)",
              }),
              stroke: new Stroke({
                color: "#fc1de6",
                width: 1,
              }),
            });
          },
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
          mapInstanceRef.current?.addLayer(newLayer);
        });
      }

      showAdminRegions();

      // Add GLOFAS stations layer
      glofasLayer = new VectorLayer({
        source: new VectorSource({
          url: glofasUriFilter,
          format: new GeoJSON(),
        }),
        style: new Style({
          image: new Circle({
            radius: 6,
            fill: new Fill({
              color: "rgba(255, 0, 0, 0.8)",
            }),
            stroke: new Stroke({
              color: "#8b0000",
              width: 1,
            }),
          }),
        }),
      });
      glofasLayer.setZIndex(200);
      mapInstanceRef.current.addLayer(glofasLayer);

      // Change cursor on hover
      mapInstanceRef.current.on("pointermove", (evt) => {
        const pixel = mapInstanceRef.current!.getEventPixel(evt.originalEvent);
        const hit = mapInstanceRef.current!.hasFeatureAtPixel(pixel, {
          layerFilter: (layer) => layer === bordersLayer || layer === childBordersLayer || layer === glofasLayer,
        });
        mapInstanceRef.current!.getTargetElement().style.cursor = hit
          ? "pointer"
          : "";
      });

      // Click handler
      mapInstanceRef.current.on("click", (evt) => {
        mapInstanceRef.current!.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
          const properties = feature.getProperties();

          // debug: print all the properties of the clicked feature
          console.log("Clicked feature properties:", properties);

          // Check if clicked on GLOFAS station
          if (layer === glofasLayer) {
            console.log("glofas clicked:", properties);
            const fid = properties.fid;
            
            // Zoom to station location
            const stationLat = properties.lat;
            const stationLon = properties.lon;
            if (stationLat && stationLon) {
              const stationCoords = fromLonLat([stationLon, stationLat]);
              animComplete = false;
              mapInstanceRef.current?.getView().animate({
                center: stationCoords,
                zoom: 10,
                duration: 500,
              }, () => {
                animComplete = true;
              });
            }
            
            // Set admin2 as selected
            const admin2Code = glofasMapAdmin2.get(fid);
            if (admin2Code) {
              selectedCode = admin2Code;
              bordersLayer?.changed();
              
              // Show child admin regions (admin3) for the admin2 region
              showChildAdminRegions(cntry, admin2Code, 2);
              
              // Set admin3 as selected child
              const admin3Code = glofasMapAdmin3.get(fid);
              if (admin3Code) {
                selectedChildCode = admin3Code;
                // Need to wait for child layer to load before calling changed()
                setTimeout(() => {
                  childBordersLayer?.changed();
                }, 500);
              }
            }
            return true;
          }

          const newSelectedRegionCode =
            properties[COL_CODE] || noCountrySelectedValue;
          const newAdminLevel = properties[COL_ADMIN_LEVEL] || 0;

          // Check if clicked on child layer (admin3)
          if (layer === childBordersLayer) {
            selectedChildCode = newSelectedRegionCode;
            childBordersLayer?.changed();
            
            // Zoom to admin3 region
            const geometry = feature.getGeometry();
            if (geometry) {
              const extent = geometry.getExtent();
              if (extent[0] !== undefined && extent[1] !== undefined && extent[2] !== undefined && extent[3] !== undefined) {
                const center: [number, number] = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
                animComplete = false;
                mapInstanceRef.current?.getView().animate({
                  center,
                  zoom: 12,
                  duration: 500,
                }, () => {
                  animComplete = true;
                });
              }
            }
            return true;
          }

          // Clicked on parent layer (admin2)
          if (selectedAdminRegion !== newSelectedRegionCode) {
            onSelect(
              properties[COL_COUNTRY] || "",
              newAdminLevel,
              newSelectedRegionCode,
            );

            // Update selected code and refresh styles
            selectedCode = newSelectedRegionCode;
            bordersLayer?.changed();


            // Show child admin regions (next level down)
            showChildAdminRegions(
              properties[COL_COUNTRY] || cntry,
              newSelectedRegionCode,
              newAdminLevel
            );

            // Zoom to admin2 region
            const geometry = feature.getGeometry();
            if (geometry) {
              const extent = geometry.getExtent();
              if (extent[0] !== undefined && extent[1] !== undefined && extent[2] !== undefined && extent[3] !== undefined) {
                const center: [number, number] = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
                animComplete = false;
                mapInstanceRef.current?.getView().animate({
                  center,
                  zoom: 9,
                  duration: 500,
                }, () => {
                  animComplete = true;
                });
              }
            }

            adminLevel = newAdminLevel;
          } else {
            // deselect
            // how will this be hit?
            onSelect(noCountrySelectedValue, 0, "");
          }

          selectedAdminRegion = newSelectedRegionCode;

          return true;
        }, {
          layerFilter: (layer) => layer === bordersLayer || layer === childBordersLayer || layer === glofasLayer,
        });
      });
    }

    return () => {
      if (childBordersLayer) {
        mapInstanceRef.current?.removeLayer(childBordersLayer);
        childBordersLayer = null;
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
