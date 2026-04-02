import VectorTileLayer from "ol/layer/VectorTile";
import MVT from "ol/format/MVT";
import ImageLayer from "ol/layer/Image";
import ImageStatic from "ol/source/ImageStatic";
import { MvtStyleCreator } from "./ibfMapStyles";
import VectorTile from "ol/source/VectorTile";
import { mockAllEventsData_MW, mockAllEventsData_ZM } from "./ibfMockData_debug";
import type { AllEventsData, EventOverviewData, EventAdminDetail, InfrastructureExposure } from "./ibfMapTypes";

// Re-export types for consumers
export type { AllEventsData, EventOverviewData, EventAdminDetail, InfrastructureExposure };

// Fetch upcoming or live event data for a country
export function getEventData(country: string): AllEventsData {
    // TODO: Use the API for fetching this for any country.
  if (country === "MW") {
    return mockAllEventsData_MW;
  } else if (country === "ZM") {
    return mockAllEventsData_ZM;
  } else return {};
}

// Raw GitHub URLs for direct file access
// TODO: move to where uris will be stored (env and other config file)
const seedRepoEventDataUrl =
  "https://raw.githubusercontent.com/rodekruis/IBF-seed-data/main/raster-data/mock-events/rgba/";
const seedRepoPopDataUrl =
  "https://raw.githubusercontent.com/rodekruis/IBF-seed-data/main/raster-data/population/rgba/";

  // TODO: rework where this goes
export const COL_COUNTRY = "country";
export const COL_ADMIN_LEVEL = "admin_level";
export const COL_CODE = "code";

// example of factor numbers on vector object size:
// full size: 300kb
// .0005 = 279kb
// .001 = 188kb
// .05 = 53kb
// .01 = 30kb
const adminZoomToFactor : number[] = [0.01, 0.01, 0.005, 0.004];

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
  getMapStyle: MvtStyleCreator,
) => {
  return new VectorTileLayer({
    source: new VectorTile({
      url: mapVectorTileUrl,
      format: new MVT(),
      maxZoom: 2,
    }),
    style: (feature) => getMapStyle(feature, selectedCountry),
  });
};

// TODO: can we just switch to ISO3 if we don't use that admin map from where we click on countries?
export const getISO3FromISO2 = (iso2: string): string => {
  const iso2ToIso3Map: Record<string, string> = {
    MW: "MWI",
    ZM: "ZMB",
    // to do
  };

  const output = iso2ToIso3Map[iso2];
  if (!output) {
    console.warn(
      `No ISO3 mapping found for ISO2 code ${iso2}, returning input as fallback`,
    );
    return iso2; // fallback to input if no mapping found
  }
  return output;
};

// Raster layer functions
export const makeEventImageLayer = async (name: string) => {
  const baseUri = seedRepoEventDataUrl;
  return makeStaticImageLayer(baseUri, name);
};

export const makePopulationImageLayer = async (country_code: string) => {
  const baseUri = seedRepoPopDataUrl;
  return makeStaticImageLayer(
    baseUri,
    `${getISO3FromISO2(country_code)}_population`,
  );
};

const makeStaticImageLayer = async (baseUri: string, name: string) => {
  const extents = await getImageExtentsAsync(baseUri, name);
  const rasterUrl = getRasterDataUrl(baseUri, name);
  return new ImageLayer({
    source: new ImageStatic({
      url: rasterUrl,
      projection: "EPSG:3857",
      interpolate: false,
      imageExtent: extents,
    }),
  });
};

/**
 * Build the URL for the png raster data. *
 * @param baseUri base URL for the data source
 * @param name filename (no extension)
 * @returns the full URL to the png image
 */
const getRasterDataUrl = (baseUri: string, name: string): string => {
  return `${baseUri}${name}.png`;
};

/**
 * Fetches the extents from the png metadata JSON file. *
 * @param baseUri base URL for the data source
 * @param name the same name as the image
 * @returns the extents in EPSG:3857, ordered [left, bottom, right, top]
 */
const getImageExtentsAsync = async (
  baseUri: string,
  name: string,
): Promise<number[]> => {
  const jsonUrl = `${baseUri}${name}_metadata.json`;
  console.log(`Fetching image extents from ${jsonUrl}`);

  try {
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    if (data?.bounds) {
      const { left, bottom, right, top } = data.bounds;
      return [left, bottom, right, top];
    }
    throw new Error('Invalid JSON structure: missing "bounds" property');
  } catch (error) {
    console.error("Error loading image extents:", error);
    return [0, 0, 0, 0];
  }
};


export const getAdminRegionUrl = (country: string, adm: number): string => {
  let factor = adminZoomToFactor[adm];
  if (!factor) {
    console.warn(`No simplification factor found for admin level ${adm}, defaulting to 0.01`);
    factor = 0.01;
  }
  return `http://localhost:9000/collections/debug.admin_areas/items?filter=country=%27${country}%27%20AND%20admin_level=%27${adm}%27&limit=10000&transform=simplify,${factor}`;
};

export const getNestedAdminUrl = (
  country: string,
  parentCode: string,
  adm: number,
): string => {
  let factor = adminZoomToFactor[adm];
  if (!factor) {
    console.warn(`No simplification factor found for admin level ${adm}, defaulting to 0.01`);
    factor = 0.01;
  }
  return `http://localhost:9000/collections/debug.admin_areas/items?filter=country=%27${country}%27%20AND%20admin_level=%27${adm}%27%20AND%20code%20LIKE%20%27${parentCode}%25%27&limit=10000&transform=simplify,${factor}`;
};

// TODO RM this
export function getAffectedRegionsForEvent(eventId: string): string[] {
  // TODO: debug code
  // Replace with actual event data
  if (eventId == "event1") {
    return ["MW31104", "MW31106", "MW31105", "MW31108", "MW31109"];
  }
  return ["MW30703", "MW30707", "MW30708", "MW30704", "MW30706", "MW30705"];
}
