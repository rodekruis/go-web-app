// Data types and structures for the IBF map backend and NRW frontend.
// The enums are shared values between the backend and frontend.
// Do not change any values without first checking with the IBF backend team.

import {
    type ExposedAdminAreaDto,
    type MapLayerDetailsDto,
} from './shared-dtos';
import type {
    AlertClass,
    ForecastSource,
    HazardType,
} from './shared-enums';

// Data for an overview of an event
export interface EventOverviewData {
  // ID to later reference the event, as well as for making other API calls for related resources
  eventId: number;

  // Internal event name (used as identifier)
  eventName: string;
  // User-friendly label for display
  eventLabel: string;

  hazardType: HazardType;

  alertClass: AlertClass;

  // Whether this is a triggering event or not.
  trigger: boolean;

  // sources used for the data (Glofas, etc.)
  forecastSources: ForecastSource[];

  // ########### fix to new struct
  centroid: {
    latitude: number;
    longitude: number;
  };

  // Event time range, as ISO date strings with hours
  startAt: string;
  reachesPeakAlertClassAt: string;
  endAt: string;

  // Event creation/update times, as ISO date strings
  firstIssuedAt: string;
  lastUpdatedAt: string;

  // TODO: use this to show an event as ongoing vs upcoming
  isOngoing: boolean;

  // List of details for all exposed admin areas of all levels.
  // The admin level is a property of each.
  exposedAdminAreas: ExposedAdminAreaDto[];

  // Other data layers that can be added to the map for this event
  availableLayers: MapLayerDetailsDto[];

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
// This is derived from EventOverviewData and passed to the map component
export interface SelectedEventDetails {
  eventId: number;
  centroid: {
    latitude: number;
    longitude: number;
  };
  // Alert class of the parent event, used to pick the color ramp for exposed areas
  alertClass: AlertClass;

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
