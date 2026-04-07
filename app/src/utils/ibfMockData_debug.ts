// NOTE: debug file to be moved to seed data repo.

import type { AllEventsData } from './ibfMapTypes';

// Mock data for testing - populations are made up, summed up the hierarchy
export const mockAllEventsData_MW: AllEventsData = {
  event1: {
    hazardType: ["Flood"],
    eventName: "Flood - Malawi",
    eventId: "event1",
    alertClass: "low",
    trigger: false,
    centroid: [33.78, -13.98], // Lilongwe City center
    startTime: "2026-04-01T06:00:00Z",
    endTime: "2026-04-12T18:00:00Z",
    rasterImageId: `flood_extent_7-hour_MWI`,
    exposedAdminRegions: [
      // ADM0 - Country (sum of all ADM3)
      [
        {
          placeCode: "MW",
          adminLevel: 0,
          name: "Malawi",
          exposedPopulation: 48400,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 3200, total: 12000 },
            { unit: "", label: "Schools", key: "schools", exposed: 8, total: 32 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 3, total: 15 },
          ],
        },
      ],
      // ADM1 - Region (same sum, all in Central)
      [
        {
          placeCode: "MW2",
          adminLevel: 1,
          name: "Central",
          exposedPopulation: 48400,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 3200, total: 12000 },
            { unit: "", label: "Schools", key: "schools", exposed: 8, total: 32 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 3, total: 15 },
          ],
        },
      ],
      // ADM2 - District (same sum, all in Lilongwe City)
      [
        {
          placeCode: "MW210",
          adminLevel: 2,
          name: "Lilongwe City",
          exposedPopulation: 48400,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 3200, total: 12000 },
            { unit: "", label: "Schools", key: "schools", exposed: 8, total: 32 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 3, total: 15 },
          ],
        },
      ],
      // ADM3 - Areas
      [
        {
          placeCode: "MW21046",
          adminLevel: 3,
          name: "Area 16",
          exposedPopulation: 3200,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 400, total: 2000 },
            { unit: "", label: "Schools", key: "schools", exposed: 1, total: 5 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 0, total: 2 },
          ],
        },
        {
          placeCode: "MW21043",
          adminLevel: 3,
          name: "Area 13",
          exposedPopulation: 8500,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 800, total: 3000 },
            { unit: "", label: "Schools", key: "schools", exposed: 2, total: 8 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 4 },
          ],
        },
        {
          placeCode: "MW21042",
          adminLevel: 3,
          name: "Area 12",
          exposedPopulation: 12400,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 1000, total: 3500 },
            { unit: "", label: "Schools", key: "schools", exposed: 2, total: 8 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 4 },
          ],
        },
        {
          placeCode: "MW21040",
          adminLevel: 3,
          name: "Area 10",
          exposedPopulation: 18700,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 700, total: 2500 },
            { unit: "", label: "Schools", key: "schools", exposed: 2, total: 7 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 3 },
          ],
        },
        {
          placeCode: "MW21031",
          adminLevel: 3,
          name: "Area 1",
          exposedPopulation: 5600,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 300, total: 1000 },
            { unit: "", label: "Schools", key: "schools", exposed: 1, total: 4 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 0, total: 2 },
          ],
        },
      ],
    ],
    dataSources: ["Glofas", "WorldPop", "OtherSource"],
    firstIssuedAt: "2026-04-01T08:30:00Z",
    lastUpdatedAt: "2026-04-02T00:00:00Z",
  },
  event2: {
    hazardType: ["Flood"],
    eventName: "Flood - Malawi",
    eventId: "event2",
    alertClass: "trigger",
    trigger: true,
    centroid: [35.32, -15.38], // Zomba center
    startTime: "2026-04-06T12:00:00Z",
    endTime: "2026-04-11T09:00:00Z",
    rasterImageId: `flood_extent_7-hour_MWI`,
    exposedAdminRegions: [
      // ADM0 - Country (sum of all ADM3)
      [
        {
          placeCode: "MW",
          adminLevel: 0,
          name: "Malawi",
          exposedPopulation: 44600,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 5600, total: 15000 },
            { unit: "", label: "Schools", key: "schools", exposed: 15, total: 48 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 6, total: 22 },
          ],
        },
      ],
      // ADM1 - Region (same sum, all in Southern)
      [
        {
          placeCode: "MW3",
          adminLevel: 1,
          name: "Southern",
          exposedPopulation: 44600,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 5600, total: 15000 },
            { unit: "", label: "Schools", key: "schools", exposed: 15, total: 48 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 6, total: 22 },
          ],
        },
      ],
      // ADM2 - District (same sum, all in Zomba)
      [
        {
          placeCode: "MW303",
          adminLevel: 2,
          name: "Zomba",
          exposedPopulation: 44600,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 5600, total: 15000 },
            { unit: "", label: "Schools", key: "schools", exposed: 15, total: 48 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 6, total: 22 },
          ],
        },
      ],
      // ADM3 - Traditional Authorities
      [
        {
          placeCode: "MW30303",
          adminLevel: 3,
          name: "SC Mkumbira",
          exposedPopulation: 2100,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 700, total: 2500 },
            { unit: "", label: "Schools", key: "schools", exposed: 2, total: 8 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 4 },
          ],
        },
        {
          placeCode: "MW30302",
          adminLevel: 3,
          name: "TA Mwambo",
          exposedPopulation: 15800,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 2000, total: 5000 },
            { unit: "", label: "Schools", key: "schools", exposed: 5, total: 15 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 2, total: 7 },
          ],
        },
        {
          placeCode: "MW30306",
          adminLevel: 3,
          name: "TA Mlumbe",
          exposedPopulation: 19500,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 2100, total: 5500 },
            { unit: "", label: "Schools", key: "schools", exposed: 6, total: 17 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 2, total: 8 },
          ],
        },
        {
          placeCode: "MW30301",
          adminLevel: 3,
          name: "TA Kuntumanji",
          exposedPopulation: 7200,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 800, total: 2000 },
            { unit: "", label: "Schools", key: "schools", exposed: 2, total: 8 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 3 },
          ],
        },
      ],
    ],
    dataSources: ["Glofas", "WorldPop", "OtherSource"],
    firstIssuedAt: "2026-04-01T14:15:00Z",
    lastUpdatedAt: "2026-04-02T00:00:00Z",
  },
  event3: {
    hazardType: ["Flood"],
    eventName: "Flood - Malawi",
    eventId: "event3",
    alertClass: "warning",
    trigger: false,
    centroid: [34.5, -14.5], // Between Lilongwe and Zomba
    startTime: "2026-04-08T15:00:00Z",
    endTime: "2026-04-11T21:00:00Z",
    rasterImageId: null,
    exposedAdminRegions: [
      // ADM0 - Country (sum of all ADM3)
      [
        {
          placeCode: "MW",
          adminLevel: 0,
          name: "Malawi",
          exposedPopulation: 29600,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 2100, total: 10500 },
            { unit: "", label: "Schools", key: "schools", exposed: 5, total: 28 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 2, total: 12 },
          ],
        },
      ],
      // ADM1 - Regions (Central: 11700, Southern: 17900)
      [
        {
          placeCode: "MW2",
          adminLevel: 1,
          name: "Central",
          exposedPopulation: 11700,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 1000, total: 5500 },
            { unit: "", label: "Schools", key: "schools", exposed: 2, total: 14 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 6 },
          ],
        },
        {
          placeCode: "MW3",
          adminLevel: 1,
          name: "Southern",
          exposedPopulation: 17900,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 1100, total: 5000 },
            { unit: "", label: "Schools", key: "schools", exposed: 3, total: 14 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 6 },
          ],
        },
      ],
      // ADM2 - Districts (Lilongwe City: 11700, Zomba: 17900)
      [
        {
          placeCode: "MW210",
          adminLevel: 2,
          name: "Lilongwe City",
          exposedPopulation: 11700,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 1000, total: 5500 },
            { unit: "", label: "Schools", key: "schools", exposed: 2, total: 14 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 6 },
          ],
        },
        {
          placeCode: "MW303",
          adminLevel: 2,
          name: "Zomba",
          exposedPopulation: 17900,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 1100, total: 5000 },
            { unit: "", label: "Schools", key: "schools", exposed: 3, total: 14 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 6 },
          ],
        },
      ],
      // ADM3 - Combined from event1 and event2
      [
        {
          placeCode: "MW21046",
          adminLevel: 3,
          name: "Area 16",
          exposedPopulation: 3200,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 400, total: 2500 },
            { unit: "", label: "Schools", key: "schools", exposed: 1, total: 6 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 0, total: 3 },
          ],
        },
        {
          placeCode: "MW21043",
          adminLevel: 3,
          name: "Area 13",
          exposedPopulation: 8500,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 600, total: 3000 },
            { unit: "", label: "Schools", key: "schools", exposed: 1, total: 8 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 3 },
          ],
        },
        {
          placeCode: "MW30303",
          adminLevel: 3,
          name: "SC Mkumbira",
          exposedPopulation: 2100,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 300, total: 1500 },
            { unit: "", label: "Schools", key: "schools", exposed: 1, total: 4 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 0, total: 2 },
          ],
        },
        {
          placeCode: "MW30302",
          adminLevel: 3,
          name: "TA Mwambo",
          exposedPopulation: 15800,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 800, total: 3500 },
            { unit: "", label: "Schools", key: "schools", exposed: 2, total: 10 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 4 },
          ],
        },
      ],
    ],
    dataSources: ["Glofas", "WorldPop", "OtherSource"],
    firstIssuedAt: "2026-04-01T19:45:00Z",
    lastUpdatedAt: "2026-04-02T00:00:00Z",
  },
};

// Mock data for Zambia testing
export const mockAllEventsData_ZM: AllEventsData = {
  event1: {
    hazardType: ["Flood"],
    eventName: "Flood - Zambia",
    eventId: "event1",
    alertClass: "low",
    trigger: false,
    centroid: [24.8, -13.68], // Mufumbwe center
    startTime: "2026-04-05T08:00:00Z",
    endTime: "2026-04-10T14:00:00Z",
    rasterImageId: `flood_map_ZMB_RP20_c0_b3857`,
    exposedAdminRegions: [
      // ADM0 - Country (sum of all ADM3)
      [
        {
          placeCode: "ZM",
          adminLevel: 0,
          name: "Zambia",
          exposedPopulation: 13100,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 1800, total: 11000 },
            { unit: "", label: "Schools", key: "schools", exposed: 3, total: 18 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 8 },
          ],
        },
      ],
      // ADM1 - Province
      [
        {
          placeCode: "ZM70",
          adminLevel: 1,
          name: "Northwestern",
          exposedPopulation: 13100,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 1800, total: 11000 },
            { unit: "", label: "Schools", key: "schools", exposed: 3, total: 18 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 8 },
          ],
        },
      ],
      // ADM2 - District
      [
        {
          placeCode: "ZM7004",
          adminLevel: 2,
          name: "Mufumbwe",
          exposedPopulation: 13100,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 1800, total: 11000 },
            { unit: "", label: "Schools", key: "schools", exposed: 3, total: 18 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 8 },
          ],
        },
      ],
      // ADM3 - Wards
      [
        {
          placeCode: "080510707",
          adminLevel: 3,
          name: "Shukwe",
          exposedPopulation: 4200,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 700, total: 5000 },
            { unit: "", label: "Schools", key: "schools", exposed: 1, total: 8 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 0, total: 4 },
          ],
        },
        {
          placeCode: "080510705",
          adminLevel: 3,
          name: "Kalambu",
          exposedPopulation: 8900,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 1100, total: 6000 },
            { unit: "", label: "Schools", key: "schools", exposed: 2, total: 10 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 4 },
          ],
        },
      ],
    ],
    dataSources: ["Glofas", "WorldPop", "OtherSource"],
    firstIssuedAt: "2026-04-01T10:00:00Z",
    lastUpdatedAt: "2026-04-02T00:00:00Z",
  },
  event2: {
    hazardType: ["Flood"],
    eventName: "Flood - Zambia",
    eventId: "event2",
    alertClass: "trigger",
    trigger: true,
    centroid: [24.8, -13.68], // Mufumbwe center
    startTime: "2026-04-07T10:00:00Z",
    endTime: "2026-04-13T16:00:00Z",
    rasterImageId: `flood_map_ZMB_RP20_c0_b3857`,
    exposedAdminRegions: [
      // ADM0 - Country (sum of all ADM3)
      [
        {
          placeCode: "ZM",
          adminLevel: 0,
          name: "Zambia",
          exposedPopulation: 18800,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 4500, total: 18000 },
            { unit: "", label: "Schools", key: "schools", exposed: 7, total: 25 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 4, total: 14 },
          ],
        },
      ],
      // ADM1 - Province
      [
        {
          placeCode: "ZM70",
          adminLevel: 1,
          name: "Northwestern",
          exposedPopulation: 18800,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 4500, total: 18000 },
            { unit: "", label: "Schools", key: "schools", exposed: 7, total: 25 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 4, total: 14 },
          ],
        },
      ],
      // ADM2 - District
      [
        {
          placeCode: "ZM7004",
          adminLevel: 2,
          name: "Mufumbwe",
          exposedPopulation: 18800,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 4500, total: 18000 },
            { unit: "", label: "Schools", key: "schools", exposed: 7, total: 25 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 4, total: 14 },
          ],
        },
      ],
      // ADM3 - Wards
      [
        {
          placeCode: "080510701",
          adminLevel: 3,
          name: "Kashima West",
          exposedPopulation: 12500,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 3000, total: 12000 },
            { unit: "", label: "Schools", key: "schools", exposed: 5, total: 16 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 3, total: 9 },
          ],
        },
        {
          placeCode: "080510702",
          adminLevel: 3,
          name: "Kashima East",
          exposedPopulation: 6300,
          exposedInfrastructure: [
            { unit: "km", label: "Roads", key: "roads", exposed: 1500, total: 6000 },
            { unit: "", label: "Schools", key: "schools", exposed: 2, total: 9 },
            { unit: "", label: "Clinics", key: "clinics", exposed: 1, total: 5 },
          ],
        },
      ],
    ],
    dataSources: ["Glofas", "WorldPop", "OtherSource"],
    firstIssuedAt: "2026-04-01T16:30:00Z",
    lastUpdatedAt: "2026-04-02T00:00:00Z",
  },
};
