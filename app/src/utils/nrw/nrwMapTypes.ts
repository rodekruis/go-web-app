// Data types and structures for the IBF map backend and NRW frontend.
// The enums are shared values between the backend and frontend.
// Do not change any values without first checking with the IBF backend team.

import { type MapLayerDetailsDto } from './shared-dtos';

// Enum to identify alert classes
// These then point to the color/style/localized string in the front end.
// A given country may support only a subset of these.
export enum AlertClassType {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

// Units for labelling values in the UI
export enum MeasurementUnits {
  Km = 'km',
  Buildings = 'buildings',
  People = 'people',
  Locations = 'locations',
  None = '',
}

// The types of items with exposure data
export enum ExposedItemType {
  Population = 'population',
  Buildings = 'buildings',
  Roads = 'roads',
  Schools = 'schools',
  Clinics = 'clinics',
}

// Data for showing exposure of a given ExposedItemType
export interface ExposureCategory {
  type: ExposedItemType;
  exposed: number;
  total: number;
}

// Event data specific to an admin area. Each admin area with exposure has one of these.
export interface EventAdminAreaData {
  placeCode: string;
  adminLevel: number;
  name: string;
  exposure: ExposureCategory[];
}

// Country-level non-event data
// This is a work in progress still and will either have more data added to it,
// or merged into some other source.
export interface CountryMapData {
  // Available map layers for the country that can be added
  availableLayers: MapLayerDetailsDto[];

  // The event data sources for forecasted events.
  // This can differentiate between supported event types as well as MRW/NRW data sources.
  // If this is empty, then the country is not supported for NRW.
  supportedEventDataSources: EventDataSources[];
}

// Supported event data sources for a country.
/** @knipignore we'll use this for toggling between NRW and MRW data sources */
export enum EventDataSources {
  Nrw = 'nrw',
  Mrw = 'mrw',
}

// Details needed by the map when an event is selected
// This is derived from EventOverviewData and passed to the map component
export interface SelectedEventDetails {
  eventId: number;
  centroid: [number, number];
  // Alert class of the parent event, used to pick the color ramp for exposed areas
  alertClass: AlertClassType;

  // Exposure data for the current event, keyed by admin level,
  // and sorted from lowest to highest (which is a byproduct of being a Record type).

  // Exposed admin areas with their exposed population,
  // keyed by admin level then place code.
  // If new data is needed to be passed to the map for rendering, add that data
  // to this object.
  exposedPopulationPerAreaByLevel: Record<number, Record<string, number>>;
  // Highest exposed population value per whole admin level.
  // This is precomputed so we don't need to find the highest value for every feature render.
  highestExposedPopulationByLevel: Record<number, number>;
}
