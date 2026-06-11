// Data types and structures for the IBF map backend and NRW frontend.
// The enums are shared values between the backend and frontend.
// Do not change any values without first checking with the IBF backend team.

import { type MapLayerDetailsDto } from './shared-dtos';

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
