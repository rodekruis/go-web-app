import VectorTileLayer from "ol/layer/VectorTile";
import MVT from "ol/format/MVT";
import ImageLayer from "ol/layer/Image";
import ImageStatic from "ol/source/ImageStatic";
import { MvtStyleCreator } from "./ibfMapStyles";
import VectorTile from "ol/source/VectorTile";

// Debug file for raster testing.
// This will be removed once the dev test flow is set up.
export const debug_testImageName = `flood_map_ZMB_RP20_c0_b3857`;

export function getUpcomingEventData(country: string): AllEventsData {
  if (country === "MW") {
    return mockAllEventsData_MW;
  } else if (country === "ZM") {
    return mockAllEventsData_ZM;
  } else return {};
}

// Raw GitHub URLs for direct file access
const seedRepoEventDataUrl =
  "https://raw.githubusercontent.com/rodekruis/IBF-seed-data/main/raster-data/mock-events/rgba/";
const seedRepoPopDataUrl =
  "https://raw.githubusercontent.com/rodekruis/IBF-seed-data/main/raster-data/population/rgba/";

export interface InfrastructureExposure {
  // counts of exposed infrastructure, by type
  // The numbers are [0] exposed, [1] total for affected regions.
  shelters: [number, number];
  roads: [number, number];
  schools: [number, number];
  waterPoints: [number, number];
  clinics: [number, number];
}

export interface EventOverviewData {
  eventType: string;
  eventName: string;
  eventId: string;
  alertLevel: string;
  centroid: [number, number]; // [lon, lat]
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  // Lists of details for each affected admin region, grouped by admin level (0, 1, 2...)
  affectedAdminRegions: EventAdminDetail[][];

  // ID for the raster image layer, or null if none
  rasterImageId: string | null;

  // sources used for the data (Glofas, etc.), with confidence score 0-100
  dataSources: Record<string, number>;

  alertCreatedDate: string; // ISO date string
  alertLastUpdatedDate: string; // ISO date string
}

export interface EventAdminDetail {
  adminCode: string;
  adminLevel: number;
  adminName: string;
  impactedPopulation: number;
  impactedHouseholds: number;
  infrastructureExposure: InfrastructureExposure;
}

export type AllEventsData = Record<string, EventOverviewData>;

// Mock data for testing - populations are made up, summed up the hierarchy
export const mockAllEventsData_MW: AllEventsData = {
  event1: {
    eventType: "Flood",
    eventName: "Flood - Malawi",
    eventId: "event1",
    alertLevel: "warning",
    centroid: [33.78, -13.98], // Lilongwe City center
    startDate: "2026-04-01T06:00:00Z",
    endDate: "2026-04-12T18:00:00Z",
    rasterImageId: `flood_extent_7-hour_MWI`,
    affectedAdminRegions: [
      // ADM0 - Country (sum of all ADM3)
      [
        {
          adminCode: "MW",
          adminLevel: 0,
          adminName: "Malawi",
          impactedPopulation: 48400,
          impactedHouseholds: 31500,
          infrastructureExposure: {
            shelters: [12, 45],
            roads: [3200, 12000],
            schools: [8, 32],
            waterPoints: [24, 78],
            clinics: [3, 15],
          },
        },
      ],
      // ADM1 - Region (same sum, all in Central)
      [
        {
          adminCode: "MW2",
          adminLevel: 1,
          adminName: "Central",
          impactedPopulation: 48400,
          impactedHouseholds: 31500,
          infrastructureExposure: {
            shelters: [12, 45],
            roads: [3200, 12000],
            schools: [8, 32],
            waterPoints: [24, 78],
            clinics: [3, 15],
          },
        },
      ],
      // ADM2 - District (same sum, all in Lilongwe City)
      [
        {
          adminCode: "MW210",
          adminLevel: 2,
          adminName: "Lilongwe City",
          impactedPopulation: 48400,
          impactedHouseholds: 31500,
          infrastructureExposure: {
            shelters: [12, 45],
            roads: [3200, 12000],
            schools: [8, 32],
            waterPoints: [24, 78],
            clinics: [3, 15],
          },
        },
      ],
      // ADM3 - Areas
      [
        {
          adminCode: "MW21046",
          adminLevel: 3,
          adminName: "Area 16",
          impactedPopulation: 3200,
          impactedHouseholds: 2100,
          infrastructureExposure: {
            shelters: [1, 8],
            roads: [400, 2000],
            schools: [1, 5],
            waterPoints: [3, 12],
            clinics: [0, 2],
          },
        },
        {
          adminCode: "MW21043",
          adminLevel: 3,
          adminName: "Area 13",
          impactedPopulation: 8500,
          impactedHouseholds: 5500,
          infrastructureExposure: {
            shelters: [3, 10],
            roads: [800, 3000],
            schools: [2, 8],
            waterPoints: [6, 18],
            clinics: [1, 4],
          },
        },
        {
          adminCode: "MW21042",
          adminLevel: 3,
          adminName: "Area 12",
          impactedPopulation: 12400,
          impactedHouseholds: 8200,
          infrastructureExposure: {
            shelters: [4, 12],
            roads: [1000, 3500],
            schools: [2, 8],
            waterPoints: [7, 20],
            clinics: [1, 4],
          },
        },
        {
          adminCode: "MW21040",
          adminLevel: 3,
          adminName: "Area 10",
          impactedPopulation: 18700,
          impactedHouseholds: 12100,
          infrastructureExposure: {
            shelters: [3, 10],
            roads: [700, 2500],
            schools: [2, 7],
            waterPoints: [5, 18],
            clinics: [1, 3],
          },
        },
        {
          adminCode: "MW21031",
          adminLevel: 3,
          adminName: "Area 1",
          impactedPopulation: 5600,
          impactedHouseholds: 3600,
          infrastructureExposure: {
            shelters: [1, 5],
            roads: [300, 1000],
            schools: [1, 4],
            waterPoints: [3, 10],
            clinics: [0, 2],
          },
        },
      ],
    ],
    dataSources: { Glofas: 85, WorldPop: 90, OtherSource: 72 },
    alertCreatedDate: "2026-04-01T08:30:00Z",
    alertLastUpdatedDate: "2026-04-02T00:00:00Z",
  },
  event2: {
    eventType: "Flood",
    eventName: "Flood - Malawi",
    eventId: "event2",
    alertLevel: "alert",
    centroid: [35.32, -15.38], // Zomba center
    startDate: "2026-04-06T12:00:00Z",
    endDate: "2026-04-11T09:00:00Z",
    rasterImageId: `flood_extent_7-hour_MWI`,
    affectedAdminRegions: [
      // ADM0 - Country (sum of all ADM3)
      [
        {
          adminCode: "MW",
          adminLevel: 0,
          adminName: "Malawi",
          impactedPopulation: 44600,
          impactedHouseholds: 31200,
          infrastructureExposure: {
            shelters: [18, 52],
            roads: [5600, 15000],
            schools: [15, 48],
            waterPoints: [31, 95],
            clinics: [6, 22],
          },
        },
      ],
      // ADM1 - Region (same sum, all in Southern)
      [
        {
          adminCode: "MW3",
          adminLevel: 1,
          adminName: "Southern",
          impactedPopulation: 44600,
          impactedHouseholds: 31200,
          infrastructureExposure: {
            shelters: [18, 52],
            roads: [5600, 15000],
            schools: [15, 48],
            waterPoints: [31, 95],
            clinics: [6, 22],
          },
        },
      ],
      // ADM2 - District (same sum, all in Zomba)
      [
        {
          adminCode: "MW303",
          adminLevel: 2,
          adminName: "Zomba",
          impactedPopulation: 44600,
          impactedHouseholds: 31200,
          infrastructureExposure: {
            shelters: [18, 52],
            roads: [5600, 15000],
            schools: [15, 48],
            waterPoints: [31, 95],
            clinics: [6, 22],
          },
        },
      ],
      // ADM3 - Traditional Authorities
      [
        {
          adminCode: "MW30303",
          adminLevel: 3,
          adminName: "SC Mkumbira",
          impactedPopulation: 2100,
          impactedHouseholds: 1400,
          infrastructureExposure: {
            shelters: [2, 8],
            roads: [700, 2500],
            schools: [2, 8],
            waterPoints: [4, 14],
            clinics: [1, 4],
          },
        },
        {
          adminCode: "MW30302",
          adminLevel: 3,
          adminName: "TA Mwambo",
          impactedPopulation: 15800,
          impactedHouseholds: 11100,
          infrastructureExposure: {
            shelters: [6, 16],
            roads: [2000, 5000],
            schools: [5, 15],
            waterPoints: [10, 30],
            clinics: [2, 7],
          },
        },
        {
          adminCode: "MW30306",
          adminLevel: 3,
          adminName: "TA Mlumbe",
          impactedPopulation: 19500,
          impactedHouseholds: 13300,
          infrastructureExposure: {
            shelters: [7, 18],
            roads: [2100, 5500],
            schools: [6, 17],
            waterPoints: [12, 35],
            clinics: [2, 8],
          },
        },
        {
          adminCode: "MW30301",
          adminLevel: 3,
          adminName: "TA Kuntumanji",
          impactedPopulation: 7200,
          impactedHouseholds: 5400,
          infrastructureExposure: {
            shelters: [3, 10],
            roads: [800, 2000],
            schools: [2, 8],
            waterPoints: [5, 16],
            clinics: [1, 3],
          },
        },
      ],
    ],
    dataSources: { Glofas: 78, WorldPop: 90, OtherSource: 88 },
    alertCreatedDate: "2026-04-01T14:15:00Z",
    alertLastUpdatedDate: "2026-04-02T00:00:00Z",
  },
  event3: {
    eventType: "Flood",
    eventName: "Flood - Malawi",
    eventId: "event3",
    alertLevel: "warning",
    centroid: [34.5, -14.5], // Between Lilongwe and Zomba
    startDate: "2026-04-08T15:00:00Z",
    endDate: "2026-04-11T21:00:00Z",
    rasterImageId: null,
    affectedAdminRegions: [
      // ADM0 - Country (sum of all ADM3)
      [
        {
          adminCode: "MW",
          adminLevel: 0,
          adminName: "Malawi",
          impactedPopulation: 29600,
          impactedHouseholds: 17800,
          infrastructureExposure: {
            shelters: [8, 38],
            roads: [2100, 10500],
            schools: [5, 28],
            waterPoints: [18, 62],
            clinics: [2, 12],
          },
        },
      ],
      // ADM1 - Regions (Central: 11700, Southern: 17900)
      [
        {
          adminCode: "MW2",
          adminLevel: 1,
          adminName: "Central",
          impactedPopulation: 11700,
          impactedHouseholds: 7000,
          infrastructureExposure: {
            shelters: [3, 18],
            roads: [1000, 5500],
            schools: [2, 14],
            waterPoints: [9, 30],
            clinics: [1, 6],
          },
        },
        {
          adminCode: "MW3",
          adminLevel: 1,
          adminName: "Southern",
          impactedPopulation: 17900,
          impactedHouseholds: 10700,
          infrastructureExposure: {
            shelters: [5, 20],
            roads: [1100, 5000],
            schools: [3, 14],
            waterPoints: [9, 32],
            clinics: [1, 6],
          },
        },
      ],
      // ADM2 - Districts (Lilongwe City: 11700, Zomba: 17900)
      [
        {
          adminCode: "MW210",
          adminLevel: 2,
          adminName: "Lilongwe City",
          impactedPopulation: 11700,
          impactedHouseholds: 7000,
          infrastructureExposure: {
            shelters: [3, 18],
            roads: [1000, 5500],
            schools: [2, 14],
            waterPoints: [9, 30],
            clinics: [1, 6],
          },
        },
        {
          adminCode: "MW303",
          adminLevel: 2,
          adminName: "Zomba",
          impactedPopulation: 17900,
          impactedHouseholds: 10700,
          infrastructureExposure: {
            shelters: [5, 20],
            roads: [1100, 5000],
            schools: [3, 14],
            waterPoints: [9, 32],
            clinics: [1, 6],
          },
        },
      ],
      // ADM3 - Combined from event1 and event2
      [
        {
          adminCode: "MW21046",
          adminLevel: 3,
          adminName: "Area 16",
          impactedPopulation: 3200,
          impactedHouseholds: 1900,
          infrastructureExposure: {
            shelters: [1, 8],
            roads: [400, 2500],
            schools: [1, 6],
            waterPoints: [4, 14],
            clinics: [0, 3],
          },
        },
        {
          adminCode: "MW21043",
          adminLevel: 3,
          adminName: "Area 13",
          impactedPopulation: 8500,
          impactedHouseholds: 5100,
          infrastructureExposure: {
            shelters: [2, 10],
            roads: [600, 3000],
            schools: [1, 8],
            waterPoints: [5, 16],
            clinics: [1, 3],
          },
        },
        {
          adminCode: "MW30303",
          adminLevel: 3,
          adminName: "SC Mkumbira",
          impactedPopulation: 2100,
          impactedHouseholds: 1300,
          infrastructureExposure: {
            shelters: [1, 5],
            roads: [300, 1500],
            schools: [1, 4],
            waterPoints: [3, 10],
            clinics: [0, 2],
          },
        },
        {
          adminCode: "MW30302",
          adminLevel: 3,
          adminName: "TA Mwambo",
          impactedPopulation: 15800,
          impactedHouseholds: 9500,
          infrastructureExposure: {
            shelters: [4, 15],
            roads: [800, 3500],
            schools: [2, 10],
            waterPoints: [6, 22],
            clinics: [1, 4],
          },
        },
      ],
    ],
    dataSources: { Glofas: 70, WorldPop: 90, OtherSource: 65 },
    alertCreatedDate: "2026-04-01T19:45:00Z",
    alertLastUpdatedDate: "2026-04-02T00:00:00Z",
  },
};

// Mock data for Zambia testing
export const mockAllEventsData_ZM: AllEventsData = {
  event1: {
    eventType: "Flood",
    eventName: "Flood - Zambia",
    eventId: "event1",
    alertLevel: "warning",
    centroid: [24.8, -13.68], // Mufumbwe center
    startDate: "2026-04-05T08:00:00Z",
    endDate: "2026-04-10T14:00:00Z",
    rasterImageId: `flood_map_ZMB_RP20_c0_b3857`,
    affectedAdminRegions: [
      // ADM0 - Country (sum of all ADM3)
      [
        {
          adminCode: "ZM",
          adminLevel: 0,
          adminName: "Zambia",
          impactedPopulation: 13100,
          impactedHouseholds: 9200,
          infrastructureExposure: {
            shelters: [5, 22],
            roads: [1800, 11000],
            schools: [3, 18],
            waterPoints: [12, 42],
            clinics: [1, 8],
          },
        },
      ],
      // ADM1 - Province
      [
        {
          adminCode: "ZM70",
          adminLevel: 1,
          adminName: "Northwestern",
          impactedPopulation: 13100,
          impactedHouseholds: 9200,
          infrastructureExposure: {
            shelters: [5, 22],
            roads: [1800, 11000],
            schools: [3, 18],
            waterPoints: [12, 42],
            clinics: [1, 8],
          },
        },
      ],
      // ADM2 - District
      [
        {
          adminCode: "ZM7004",
          adminLevel: 2,
          adminName: "Mufumbwe",
          impactedPopulation: 13100,
          impactedHouseholds: 9200,
          infrastructureExposure: {
            shelters: [5, 22],
            roads: [1800, 11000],
            schools: [3, 18],
            waterPoints: [12, 42],
            clinics: [1, 8],
          },
        },
      ],
      // ADM3 - Wards
      [
        {
          adminCode: "080510707",
          adminLevel: 3,
          adminName: "Shukwe",
          impactedPopulation: 4200,
          impactedHouseholds: 3000,
          infrastructureExposure: {
            shelters: [2, 10],
            roads: [700, 5000],
            schools: [1, 8],
            waterPoints: [5, 18],
            clinics: [0, 4],
          },
        },
        {
          adminCode: "080510705",
          adminLevel: 3,
          adminName: "Kalambu",
          impactedPopulation: 8900,
          impactedHouseholds: 6200,
          infrastructureExposure: {
            shelters: [3, 12],
            roads: [1100, 6000],
            schools: [2, 10],
            waterPoints: [7, 24],
            clinics: [1, 4],
          },
        },
      ],
    ],
    dataSources: { Glofas: 82, WorldPop: 90, OtherSource: 91 },
    alertCreatedDate: "2026-04-01T10:00:00Z",
    alertLastUpdatedDate: "2026-04-02T00:00:00Z",
  },
  event2: {
    eventType: "Flood",
    eventName: "Flood - Zambia",
    eventId: "event2",
    alertLevel: "alert",
    centroid: [24.8, -13.68], // Mufumbwe center
    startDate: "2026-04-07T10:00:00Z",
    endDate: "2026-04-13T16:00:00Z",
    rasterImageId: `flood_map_ZMB_RP20_c0_b3857`,
    affectedAdminRegions: [
      // ADM0 - Country (sum of all ADM3)
      [
        {
          adminCode: "ZM",
          adminLevel: 0,
          adminName: "Zambia",
          impactedPopulation: 18800,
          impactedHouseholds: 14100,
          infrastructureExposure: {
            shelters: [9, 28],
            roads: [4500, 18000],
            schools: [7, 25],
            waterPoints: [22, 58],
            clinics: [4, 14],
          },
        },
      ],
      // ADM1 - Province
      [
        {
          adminCode: "ZM70",
          adminLevel: 1,
          adminName: "Northwestern",
          impactedPopulation: 18800,
          impactedHouseholds: 14100,
          infrastructureExposure: {
            shelters: [9, 28],
            roads: [4500, 18000],
            schools: [7, 25],
            waterPoints: [22, 58],
            clinics: [4, 14],
          },
        },
      ],
      // ADM2 - District
      [
        {
          adminCode: "ZM7004",
          adminLevel: 2,
          adminName: "Mufumbwe",
          impactedPopulation: 18800,
          impactedHouseholds: 14100,
          infrastructureExposure: {
            shelters: [9, 28],
            roads: [4500, 18000],
            schools: [7, 25],
            waterPoints: [22, 58],
            clinics: [4, 14],
          },
        },
      ],
      // ADM3 - Wards
      [
        {
          adminCode: "080510701",
          adminLevel: 3,
          adminName: "Kashima West",
          impactedPopulation: 12500,
          impactedHouseholds: 9400,
          infrastructureExposure: {
            shelters: [6, 18],
            roads: [3000, 12000],
            schools: [5, 16],
            waterPoints: [14, 38],
            clinics: [3, 9],
          },
        },
        {
          adminCode: "080510702",
          adminLevel: 3,
          adminName: "Kashima East",
          impactedPopulation: 6300,
          impactedHouseholds: 4700,
          infrastructureExposure: {
            shelters: [3, 10],
            roads: [1500, 6000],
            schools: [2, 9],
            waterPoints: [8, 20],
            clinics: [1, 5],
          },
        },
      ],
    ],
    dataSources: { Glofas: 90, WorldPop: 90, OtherSource: 78 },
    alertCreatedDate: "2026-04-01T16:30:00Z",
    alertLastUpdatedDate: "2026-04-02T00:00:00Z",
  },
};

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

export function getAffectedRegionsForEvent(eventId: string): string[] {
  // TODO: debug code
  // Replace with actual event data
  if (eventId == "event1") {
    return ["MW31104", "MW31106", "MW31105", "MW31108", "MW31109"];
  }
  return ["MW30703", "MW30707", "MW30708", "MW30704", "MW30706", "MW30705"];
}
