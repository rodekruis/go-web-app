// Other endpoints needed:
//  - Get population raster + metadata (There is only one per country)
//  - Get event raster + metadata (may be more than one per event)

// Data handled through map server endpoints:
//  - admin areas
//  - point data (glofas, hospitals, etc.)
//  - Roads (served as MVT vector tiles)
//  - Buildings (also MVT) 


export interface InfrastructureExposure {
  // counts of exposed infrastructure, by type
  // The numbers are [0] exposed, [1] total for affected regions.
  // Note: if we think this will be more dynamic, we can just change this
  // to a list of objects that have numbers and string labels.
  // The front end would just display them in the oder received, and wouldn't
  // need to know the specific types.
  
  shelters: [number, number];
  roads: [number, number];
  schools: [number, number];
  waterPoints: [number, number];
  clinics: [number, number];
}

// Most general information about an event.
// I don't forsee the payload being that large, but we need to check against real data.
// Data layers and more detailed info would be queried through separate API calls
export interface EventOverviewData {
  eventType: string; // e.g. flood, drought, etc.
  eventName: string; // Human readable name
  eventId: string;

  // For alert level, we'll need to map this on the FE for coloring.
  // The value here is more like an enum val, that we map to a string/color on the FE 
  alertLevel: string;

  // affects where we zoom to, and where we place the icon on the map
  centroid: [number, number]; // [lon, lat]

  // Event time range
  startDate: string; // ISO date string with hours
  endDate: string; // ISO date string with hours

  // Event creation/update times
  eventCreatedDate: string; // ISO date string
  eventLastUpdatedDate: string; // ISO date string

  // Lists of details for each affected admin region, grouped by admin level (0, 1, 2...)
  // Note: I added admin0 here, although we only went up to admin 1 in the pipelines.
  // Should we just add admin0 to the pipelines? It makes it much easier for the FE 
  affectedAdminRegions: EventAdminDetail[][];

  // ID for the raster image layer, or null if none
  // TODO: we need more layers. Should this be a list of layers? Or just more vals like this?
  rasterImageId: string | null;

  // sources used for the data (Glofas, etc.), with confidence score 0-100
  // Question: Or do we want this 0 to 1 range?
  dataSources: Record<string, number>;

}

// Each admin area has this info
export interface EventAdminDetail {
  adminCode: string;
  adminLevel: number;
  adminName: string;
  impactedPopulation: number;
  impactedHouseholds: number;
  infrastructureExposure: InfrastructureExposure;
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
  avaialableLayers: string[];

  // We need some way to to know if IBF supports this or not,
  // and if so what kind of support (IBF, MRW, etc.)
  nrwSupport: string;
}
