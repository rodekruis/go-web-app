// Data types and structures for the IBF map backend and NRW frontend.
// The enums are shared values between the backend and frontend.
// Do not change any values without first checking with the IBF backend team.

import { type MapLayerDetailsDto } from './shared-dtos';

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
export enum EventDataSources {
  Nrw = 'nrw',
  Mrw = 'mrw',
}

// Details needed by the map when an event is selected
// This is derived from EventResponseDto and passed to the map component
export interface SelectedEventMapDetails {
  eventId: number;
  centroid: { latitude: number; longitude: number };
  // Admin area codes affected by this event, keyed by admin level
  exposedRegionsByLevel: Map<number, string[]>;
}
