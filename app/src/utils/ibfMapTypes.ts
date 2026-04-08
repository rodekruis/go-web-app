// Data types and structures for the IBF map backend and NRW frontend.
// The enums are shared values between the backend and frontend.
// Do not change any values without out first checking with the IBF backend team.

export enum HazardType {
  Flood = "flood",
  Drought = "drought",
}

export enum AlertClassType {
  Trigger = "trigger",
  High = "high",
  Medium = "medium",  
  Low = "low",
}

// Units for labelling values in the UI
export enum MeasurementUnits {
  Km = "km",
  Buildings = "buildings",
  People = "people",
  Locations = "locations",
  None = "",
}

// The types of items with exposure data
export enum ExposedItemType {
  Population = "population",
  Buildings = "buildings",
  Roads = "roads",
  Schools = "schools",
  Clinics = "clinics",
}

export enum MapLayerDataType {
  Population = "population",
  EventExtent = "event_extent",
  RcLocs = "rc_locs",
  Clinics = "clinics",
}

export enum MapLayerDisplayType {
  Raster = "raster",
  Vector = "vector",
  Point = "point",
  MVT = "mvt"
}

// Data for showing exposure of a given ExposedItemType
export interface ExposedItem {
  type: ExposedItemType;
  exposed: number;
  total: number;
  unit: MeasurementUnits;
}

// Details for a data layer that can be added to a map
export interface MapLayerDetails {
  // ID that can be used to fetch the actual map layer data
  resourceId: string;

  // The type of data on this layer
  // This can be used to label the layer in the UI, style it, etc.
  dataType: MapLayerDataType;
  
  // The way this data will be displayed
  displayType: MapLayerDisplayType;
}

// Data for the an overview of an event
export interface EventOverviewData {
  hazardType: HazardType[];

  // Translated, user-facing name for the event
  eventName: string;

  // ID to later reference the event, as well as for making other API calls for related resources
  eventId: string;

  alertClass: AlertClassType;

  // Whether this is a triggering event or not.
  trigger: boolean;

  // affects where we zoom to, and where we place the icon on the map
  // [lon, lat]
  centroid: [number, number];

  // Event time range, as ISO date strings with hours
  startTime: string; 
  endTime: string;
  peakTime: string;

  // Event creation/update times, as ISO date strings
  firstIssuedAt: string;
  lastUpdatedAt: string;

  // Lists of details for each exposed admin region, grouped by admin level (0, 1, 2...)
  exposedAdminRegions: EventAdminAreaData[][];

  // Other data layers that can be added to the map for this event
  availableLayers: MapLayerDetails[];

  // sources used for the data (Glofas, etc.)
  dataSources: DataSourceType[];

}

// Sources for the data used in events, map layers, etc.
export enum DataSourceType {
  Glofas = "glofas",
  Other = "other",
}

// Event data specific to an admin area. Each admin area with exposure has one of these.
export interface EventAdminAreaData {
  placeCode: string;
  adminLevel: number;
  name: string;
  exposure: ExposedItem[];
}

// Data for all events, keyed by event ID
export type AllEventsData = Record<string, EventOverviewData>;

// Country-level non-event data.
// This is a work in progress still, and will be mocked on the backend until we can know more what can be used.
export interface CountryMapData {
  // Available map layers for the country that can be added
  availableLayers: MapLayerDetails[];

  // The event data sources for forecasted events.
  // This can differentiate between supported event types as well as MRW/IBF data sources.
  // If this is empty, then the country is not supported for NRW.
  supportedEventDataSources: EventDataSources[];
}

// Supported event data sources for a country.
export enum EventDataSources {
  IbfFLood = "ibf_flood",
  IbfDrought = "ibf_drought",
  MrwFlood = "mrw_flood",
}