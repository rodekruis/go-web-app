import { rasterImageDir } from '#config';
import VectorTileLayer from 'ol/layer/VectorTile';
import MVT from 'ol/format/MVT';
import ImageLayer from 'ol/layer/Image';
import ImageStatic from 'ol/source/ImageStatic';
import { MvtStyleCreator } from './ibfMapStyles';
import VectorTile from 'ol/source/VectorTile';

import styles from "./styles.module.css";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON";

// Debug file for raster testing.
// This will be removed once the dev test flow is set up.
export const debug_testImageName = `flood_map_ZMB_RP20_c0_b3857`;

/**
 * Create a vector tile layer for the map.
 * @param selectedCountry The ISO_A2 code of the selected country, or noCountrySelectedValue for none.
 * @param mapVectorTileUrl The URL template for the vector tiles
 * @param getMapStyle A function for an MVT tile style creator
 * @returns A VectorTileLayer
 */
export const makeMvtLayerAsync = (
    selectedCountry: string,
    mapVectorTileUrl: string,
    getMapStyle: MvtStyleCreator
) => {
    return new VectorTileLayer({
        source: new VectorTile({
            url: mapVectorTileUrl,
            format: new MVT(),
            maxZoom: 2,
        }),
        style: (feature) => getMapStyle(feature, selectedCountry),
    });
}

/**
 * Creates a static layer from a png and json file with the extents. *
 * @param name name of the image (no extension)
 * @returns ImageLayer to add to a map
 */
export const makeStaticImageLayer = async (name: string) => {
    const extents = await getImageExtentsAsync(name);
    const rasterData = await getRasterDataPng(name);
    return new ImageLayer({
        source: new ImageStatic({
            url: rasterData,
            projection: 'EPSG:3857',
            interpolate: false,
            imageExtent: extents,
        }),
    });
}

/**
 * Get the png raster data from the server (or debug folder when testing). *
 * @param name filename (no extension)
 * @returns the png image
 */
const getRasterDataPng = (name : string) => {
    // Currently this only supports the debug dev flow.
    // The logic will be added to later to support the actual meta data flow.
    
    // For now, return a png for the local raster image dir.
    return `${rasterImageDir}${name}.png`;
}

/**
 * Returns the extents from the png meta data. *
 * @param name the same name as the image
 * @returns the extents in EPSG:3857, ordered [left, bottom, right, top]
 */
const getImageExtentsAsync = (name : string) => {
    // Currently this only supports the debug dev flow.
    // The logic will be added to later to support the actual meta data flow.

    const jsonData = `${rasterImageDir}${name}_metadata.json`;
    console.log(`Fetching image extents from ${jsonData}`);
    // fetch json and get the extents from it
    return fetch(jsonData)
        .then(response => response.json())
        .then(data => {
            if (data && data.bounds) {
                const { left, bottom, right, top } = data.bounds;
                return [left, bottom, right, top];
            } else {
                throw new Error('Invalid JSON structure: missing "bounds" property');
            }
        })
        .catch(error => {
            console.error('Error loading image extents:', error);
            // Return default extents or handle as needed
            return [0, 0, 0, 0];
        });
}

export const COL_COUNTRY = "country";
export const COL_ADMIN_LEVEL = "admin_level";
export const COL_CODE = "code";


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


export const getAdminRegionUrl = (country: string, adm: number): string => {
  return `http://localhost:9000/collections/debug.admin_areas/items?filter=country=%27${country}%27%20AND%20admin_level=%27${adm}%27&limit=10000&transform=simplify,${factor}`;
};

export const getNestedAdminUrl = (
  country: string,
  parentCode: string,
  adm: number,
): string => {
  return `http://localhost:9000/collections/debug.admin_areas/items?filter=country=%27${country}%27%20AND%20admin_level=%27${adm}%27%20AND%20code%20LIKE%20%27${parentCode}%25%27&limit=10000&transform=simplify,${factor}`;
};
/*
export const getAdmin3Layer = (country: string, parentCode: string) => {
    new VectorLayer({
        source: new VectorSource({
          url: getNestedAdminUrl(country, parentCode, 3),
          format: new GeoJSON(),
        }),
        style: (feature) => {
          const code = feature.get(COL_CODE);
          const affectedRegion =
            EventFFFFMapRegionCodes.get(selectedEventId) || null;
          return styleAdmin3Region(
            code,
            selectedAdmin3Code,
            affectedRegion,
            isEventSelected,
          );
        },
      });
}*/