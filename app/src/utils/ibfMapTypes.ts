// Other endpoints needed:
//  - Get population raster + metadata (There is only one per country)
//  - Get event raster + metadata (may be more than one per event)

// Data handled through map server endpoints:
//  - admin areas
//  - point data (glofas, hospitals, etc.)
//  - Roads (served as MVT vector tiles)
//  - Buildings (also MVT) 


export interface ExposedItem {
  unit: string;
  label: string;
  key: string;
  exposed: number;
  total: number
}
  

// Most general information about an event.
// I don't foresee the payload being that large, but we need to check against real data.
// Data layers and more detailed info would be queried through separate API calls
export interface EventOverviewData {
  // Hazard types for this event in a list
  // e.g. flood, drought, etc.
  hazardType: string[];

  eventName: string; // Human readable name
  eventId: string;

  // For alert level, we'll need to map this on the FE for coloring.
  // The value here is more like an enum val, that we map to a string/color on the FE 
  alertClass: string;

  // Whether this is a triggering event or not.
  trigger: boolean;

  // affects where we zoom to, and where we place the icon on the map
  centroid: [number, number]; // [lon, lat]

  // Event time range
  startTime: string; // ISO date string with hours
  endTime: string; // ISO date string with hours
  peakTime: string; // ISO date string with hours

  // Event creation/update times
  firstIssuedAt: string; // ISO date string
  lastUpdatedAt: string; // ISO date string

  // Lists of details for each exposed admin region, grouped by admin level (0, 1, 2...)
  // Note: I added admin0 here, although we only went up to admin 1 in the pipelines.
  // Should we just add admin0 to the pipelines? It makes it much easier for the FE 
  exposedAdminRegions: EventAdminAreaData[][];

  // ID for the raster image layer, or null if none
  // TODO: we need more layers. Should this be a list of layers? Or just more vals like this?
  rasterImageId: string | null;

  // sources used for the data (Glofas, etc.)
  dataSources: string[];

}

// Each admin area has this info
export interface EventAdminAreaData {
  placeCode: string;
  adminLevel: number;
  name: string;
  exposure: ExposedItem[];
}

// This would be a list of all upcoming events
// I think the API would return this, since we normally only have 1 active event, and I don't
// think this data would get too big. It needs to be checked against actual data.
export type AllEventsData = Record<string, EventOverviewData>;

// This is the TBD data you'd first get when loading a country.
// It will be merged with other data
// For now, it will be collecting items we know are shared at the country level,
// but don't have another place for now.
// We may also add an admin 0 layer to the admin boundaries DB, which could house some of this info
export interface CountryMapData {
  // ids of layers we have for this country
  // i.e. population, water_points, etc.
  availableLayers: string[];

  // We need some way to know if IBF supports this or not,
  // and if so what kind of support (IBF, MRW, etc.)
  nrwSupport: string;
}


export interface MapLayerDetails {
  id: string;
  label: string;
  displayType: string; //  e.g. "raster", "vector", "point", "mvt", etc.
}