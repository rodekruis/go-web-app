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
