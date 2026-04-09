// NOTE: debug file to be moved to seed data repo.

import type { AllEventsData } from './ibfMapTypes_old';

// Mock data for testing - populations are made up, summed up the hierarchy
export const mockAllEventsData_MW: AllEventsData = {
  event1: {
    eventType: "Flood",
    eventName: "Flood - Malawi",
    eventId: "event1",
    alertLevel: "low",
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
    eventCreatedDate: "2026-04-01T08:30:00Z",
    eventLastUpdatedDate: "2026-04-02T00:00:00Z",
  },
  event2: {
    eventType: "Flood",
    eventName: "Flood - Malawi",
    eventId: "event2",
    alertLevel: "trigger",
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
    eventCreatedDate: "2026-04-01T14:15:00Z",
    eventLastUpdatedDate: "2026-04-02T00:00:00Z",
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
    eventCreatedDate: "2026-04-01T19:45:00Z",
    eventLastUpdatedDate: "2026-04-02T00:00:00Z",
  },
};

// Mock data for Zambia testing
export const mockAllEventsData_ZM: AllEventsData = {
  event1: {
    eventType: "Flood",
    eventName: "Flood - Zambia",
    eventId: "event1",
    alertLevel: "low",
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
    eventCreatedDate: "2026-04-01T10:00:00Z",
    eventLastUpdatedDate: "2026-04-02T00:00:00Z",
  },
  event2: {
    eventType: "Flood",
    eventName: "Flood - Zambia",
    eventId: "event2",
    alertLevel: "trigger",
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
    eventCreatedDate: "2026-04-01T16:30:00Z",
    eventLastUpdatedDate: "2026-04-02T00:00:00Z",
  },
};
