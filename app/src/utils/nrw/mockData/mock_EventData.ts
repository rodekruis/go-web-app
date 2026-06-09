import { ExposedItemType } from '../nrwMapTypes';
import { type EventResponseDto } from '../shared-dtos';
import {
    AlertClass,
    ForecastSource,
    HazardType,
    type Layer,
    MapLayerDisplayType,
    MapLayerInfoType,
} from '../shared-enums';

// Mock data for testing - populations are made up, summed up the hierarchy
export const mockAllEventsData_MW: EventResponseDto[] = [
    {
        hazardType: HazardType.floods,
        eventName: 'Flood - Malawi',
        eventId: 1001,
        eventLabel: 'Flood Event',
        alertClass: AlertClass.Low,
        trigger: false,
        centroid: { latitude: -13.98, longitude: 33.78 }, // Lilongwe City center
        startAt: '2026-04-01T06:00:00Z',
        reachesPeakAlertClassAt: '2026-04-07T12:00:00Z',
        endAt: '2026-04-12T18:00:00Z',
        availableLayers: [{
            resourceId: 'flood_extent_7-hour_MWI',
            dataType: MapLayerInfoType.EventExtent,
            displayType: MapLayerDisplayType.Raster,
        }],
        exposedAdminAreas: [
            // ADM0 - Country (sum of all ADM3)
            {
                placeCode: 'MWI',
                adminLevel: 0,
                name: 'Malawi',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 48400,
                        total: 48400,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 3200,
                        total: 12000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 8,
                        total: 32,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 3,
                        total: 15,
                    },
                ],
            },
            // ADM1 - Region (same sum, all in Central)
            {
                placeCode: 'MW2',
                adminLevel: 1,
                name: 'Central',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 48400,
                        total: 48400,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 3200,
                        total: 12000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 8,
                        total: 32,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 3,
                        total: 15,
                    },
                ],
            },
            // ADM2 - District (same sum, all in Lilongwe City)
            {
                placeCode: 'MW210',
                adminLevel: 2,
                name: 'Lilongwe City',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 48400,
                        total: 48400,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 3200,
                        total: 12000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 8,
                        total: 32,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 3,
                        total: 15,
                    },
                ],
            },
            // ADM3 - Areas
            {
                placeCode: 'MW21046',
                adminLevel: 3,
                name: 'Area 16',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 3200,
                        total: 3200,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 400,
                        total: 2000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 1,
                        total: 5,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 0,
                        total: 2,
                    },
                ],
            },
            {
                placeCode: 'MW21043',
                adminLevel: 3,
                name: 'Area 13',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 8500,
                        total: 8500,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 800,
                        total: 3000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 2,
                        total: 8,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 4,
                    },
                ],
            },
            {
                placeCode: 'MW21042',
                adminLevel: 3,
                name: 'Area 12',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 12400,
                        total: 12400,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 1000,
                        total: 3500,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 2,
                        total: 8,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 4,
                    },
                ],
            },
            {
                placeCode: 'MW21040',
                adminLevel: 3,
                name: 'Area 10',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 18700,
                        total: 18700,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 700,
                        total: 2500,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 2,
                        total: 7,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 3,
                    },
                ],
            },
            {
                placeCode: 'MW21031',
                adminLevel: 3,
                name: 'Area 1',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 5600,
                        total: 5600,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 300,
                        total: 1000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 1,
                        total: 4,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 0,
                        total: 2,
                    },
                ],
            },
        ],
        forecastSources: [ForecastSource.glofas, ForecastSource.ecmwf],
        firstIssuedAt: '2026-04-01T08:30:00Z',
        lastUpdatedAt: '2026-04-02T00:00:00Z',
        isOngoing: false,
    },
    {
        hazardType: HazardType.floods,
        eventName: 'Flood - Malawi',
        eventId: 1002,
        eventLabel: 'Flood Event',
        alertClass: AlertClass.High,
        trigger: true,
        centroid: { latitude: -15.38, longitude: 35.32 }, // Zomba center
        startAt: '2026-04-06T12:00:00Z',
        reachesPeakAlertClassAt: '2026-04-08T18:00:00Z',
        endAt: '2026-04-11T09:00:00Z',
        availableLayers: [{
            resourceId: 'flood_extent_7-hour_MWI',
            dataType: MapLayerInfoType.EventExtent,
            displayType: MapLayerDisplayType.Raster,
        }],
        exposedAdminAreas: [
            // ADM0 - Country (sum of all ADM3)
            {
                placeCode: 'MWI',
                adminLevel: 0,
                name: 'Malawi',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 44600,
                        total: 44600,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 5600,
                        total: 15000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 15,
                        total: 48,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 6,
                        total: 22,
                    },
                ],
            },
            // ADM1 - Region (same sum, all in Southern)
            {
                placeCode: 'MW3',
                adminLevel: 1,
                name: 'Southern',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 44600,
                        total: 44600,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 5600,
                        total: 15000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 15,
                        total: 48,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 6,
                        total: 22,
                    },
                ],
            },
            // ADM2 - District (same sum, all in Zomba)
            {
                placeCode: 'MW303',
                adminLevel: 2,
                name: 'Zomba',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 44600,
                        total: 44600,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 5600,
                        total: 15000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 15,
                        total: 48,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 6,
                        total: 22,
                    },
                ],
            },
            // ADM3 - Traditional Authorities
            {
                placeCode: 'MW30303',
                adminLevel: 3,
                name: 'SC Mkumbira',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 2100,
                        total: 2100,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 700,
                        total: 2500,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 2,
                        total: 8,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 4,
                    },
                ],
            },
            {
                placeCode: 'MW30302',
                adminLevel: 3,
                name: 'TA Mwambo',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 15800,
                        total: 15800,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 2000,
                        total: 5000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 5,
                        total: 15,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 2,
                        total: 7,
                    },
                ],
            },
            {
                placeCode: 'MW30306',
                adminLevel: 3,
                name: 'TA Mlumbe',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 19500,
                        total: 19500,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 2100,
                        total: 5500,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 6,
                        total: 17,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 2,
                        total: 8,
                    },
                ],
            },
            {
                placeCode: 'MW30301',
                adminLevel: 3,
                name: 'TA Kuntumanji',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 7200,
                        total: 7200,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 800,
                        total: 2000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 2,
                        total: 8,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 3,
                    },
                ],
            },
        ],
        forecastSources: [ForecastSource.glofas, ForecastSource.ecmwf],
        firstIssuedAt: '2026-04-01T14:15:00Z',
        lastUpdatedAt: '2026-04-02T00:00:00Z',
        isOngoing: false,
    },
    {
        hazardType: HazardType.floods,
        eventName: 'Flood - Malawi',
        eventId: 1003,
        eventLabel: 'Flood Event',
        alertClass: AlertClass.Medium,
        trigger: false,
        centroid: { latitude: -14.5, longitude: 34.5 }, // Between Lilongwe and Zomba
        startAt: '2026-04-08T15:00:00Z',
        reachesPeakAlertClassAt: '2026-04-10T06:00:00Z',
        endAt: '2026-04-11T21:00:00Z',
        availableLayers: [],
        exposedAdminAreas: [
            // ADM0 - Country (sum of all ADM3)
            {
                placeCode: 'MWI',
                adminLevel: 0,
                name: 'Malawi',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 29600,
                        total: 29600,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 2100,
                        total: 10500,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 5,
                        total: 28,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 2,
                        total: 12,
                    },
                ],
            },
            // ADM1 - Regions (Central: 11700, Southern: 17900)
            {
                placeCode: 'MW2',
                adminLevel: 1,
                name: 'Central',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 11700,
                        total: 11700,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 1000,
                        total: 5500,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 2,
                        total: 14,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 6,
                    },
                ],
            },
            {
                placeCode: 'MW3',
                adminLevel: 1,
                name: 'Southern',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 17900,
                        total: 17900,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 1100,
                        total: 5000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 3,
                        total: 14,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 6,
                    },
                ],
            },
            // ADM2 - Districts (Lilongwe City: 11700, Zomba: 17900)
            {
                placeCode: 'MW210',
                adminLevel: 2,
                name: 'Lilongwe City',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 11700,
                        total: 11700,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 1000,
                        total: 5500,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 2,
                        total: 14,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 6,
                    },
                ],
            },
            {
                placeCode: 'MW303',
                adminLevel: 2,
                name: 'Zomba',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 17900,
                        total: 17900,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 1100,
                        total: 5000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 3,
                        total: 14,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 6,
                    },
                ],
            },
            // ADM3 - Combined from event1 and event2
            {
                placeCode: 'MW21046',
                adminLevel: 3,
                name: 'Area 16',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 3200,
                        total: 3200,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 400,
                        total: 2500,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 1,
                        total: 6,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 0,
                        total: 3,
                    },
                ],
            },
            {
                placeCode: 'MW21043',
                adminLevel: 3,
                name: 'Area 13',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 8500,
                        total: 8500,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 600,
                        total: 3000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 1,
                        total: 8,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 3,
                    },
                ],
            },
            {
                placeCode: 'MW30303',
                adminLevel: 3,
                name: 'SC Mkumbira',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 2100,
                        total: 2100,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 300,
                        total: 1500,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 1,
                        total: 4,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 0,
                        total: 2,
                    },
                ],
            },
            {
                placeCode: 'MW30302',
                adminLevel: 3,
                name: 'TA Mwambo',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 15800,
                        total: 15800,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 800,
                        total: 3500,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 2,
                        total: 10,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 4,
                    },
                ],
            },
        ],
        forecastSources: [ForecastSource.glofas, ForecastSource.ecmwf],
        firstIssuedAt: '2026-04-01T19:45:00Z',
        lastUpdatedAt: '2026-04-02T00:00:00Z',
        isOngoing: false,
    },
];

// Mock data for Zambia testing
export const mockAllEventsData_ZM: EventResponseDto[] = [
    {
        hazardType: HazardType.floods,
        eventName: 'Flood - Zambia',
        eventId: 2001,
        eventLabel: 'Flood Event',
        alertClass: AlertClass.Low,
        trigger: false,
        centroid: { latitude: -13.68, longitude: 24.8 }, // Mufumbwe center
        startAt: '2026-04-05T08:00:00Z',
        reachesPeakAlertClassAt: '2026-04-07T20:00:00Z',
        endAt: '2026-04-10T14:00:00Z',
        availableLayers: [{
            resourceId: 'flood_map_ZMB_RP20_c0_b3857',
            dataType: MapLayerInfoType.EventExtent,
            displayType: MapLayerDisplayType.Raster,
        }],
        exposedAdminAreas: [
            // ADM0 - Country (sum of all ADM3)
            {
                placeCode: 'ZMB',
                adminLevel: 0,
                name: 'Zambia',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 13100,
                        total: 13100,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 1800,
                        total: 11000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 3,
                        total: 18,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 8,
                    },
                ],
            },
            // ADM1 - Province
            {
                placeCode: 'ZM70',
                adminLevel: 1,
                name: 'Northwestern',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 13100,
                        total: 13100,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 1800,
                        total: 11000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 3,
                        total: 18,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 8,
                    },
                ],
            },
            // ADM2 - District
            {
                placeCode: 'ZM7004',
                adminLevel: 2,
                name: 'Mufumbwe',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 13100,
                        total: 13100,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 1800,
                        total: 11000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 3,
                        total: 18,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 8,
                    },
                ],
            },
            // ADM3 - Wards
            {
                placeCode: '080510707',
                adminLevel: 3,
                name: 'Shukwe',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 4200,
                        total: 4200,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 700,
                        total: 5000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 1,
                        total: 8,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 0,
                        total: 4,
                    },
                ],
            },
            {
                placeCode: '080510705',
                adminLevel: 3,
                name: 'Kalambu',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 8900,
                        total: 8900,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 1100,
                        total: 6000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 2,
                        total: 10,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 4,
                    },
                ],
            },
        ],
        forecastSources: [ForecastSource.glofas, ForecastSource.ecmwf],
        firstIssuedAt: '2026-04-01T10:00:00Z',
        lastUpdatedAt: '2026-04-02T00:00:00Z',
        isOngoing: false,
    },
    {
        hazardType: HazardType.floods,
        eventName: 'Flood - Zambia',
        eventId: 2002,
        eventLabel: 'Flood Event',
        alertClass: AlertClass.Medium,
        trigger: true,
        centroid: { latitude: -13.68, longitude: 24.8 }, // Mufumbwe center
        startAt: '2026-04-07T10:00:00Z',
        reachesPeakAlertClassAt: '2026-04-10T08:00:00Z',
        endAt: '2026-04-13T16:00:00Z',
        availableLayers: [{
            resourceId: 'flood_map_ZMB_RP20_c0_b3857',
            dataType: MapLayerInfoType.EventExtent,
            displayType: MapLayerDisplayType.Raster,
        }],
        exposedAdminAreas: [
            // ADM0 - Country (sum of all ADM3)
            {
                placeCode: 'ZMB',
                adminLevel: 0,
                name: 'Zambia',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 18800,
                        total: 18800,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 4500,
                        total: 18000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 7,
                        total: 25,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 4,
                        total: 14,
                    },
                ],
            },
            // ADM1 - Province
            {
                placeCode: 'ZM70',
                adminLevel: 1,
                name: 'Northwestern',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 18800,
                        total: 18800,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 4500,
                        total: 18000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 7,
                        total: 25,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 4,
                        total: 14,
                    },
                ],
            },
            // ADM2 - District
            {
                placeCode: 'ZM7004',
                adminLevel: 2,
                name: 'Mufumbwe',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 18800,
                        total: 18800,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 4500,
                        total: 18000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 7,
                        total: 25,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 4,
                        total: 14,
                    },
                ],
            },
            // ADM3 - Wards
            {
                placeCode: '080510701',
                adminLevel: 3,
                name: 'Kashima West',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 12500,
                        total: 12500,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 3000,
                        total: 12000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 5,
                        total: 16,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 3,
                        total: 9,
                    },
                ],
            },
            {
                placeCode: '080510702',
                adminLevel: 3,
                name: 'Kashima East',
                exposure: [
                    {
                        type: ExposedItemType.Population as unknown as Layer,
                        exposed: 6300,
                        total: 6300,
                    },
                    {
                        type: ExposedItemType.Roads as unknown as Layer,
                        exposed: 1500,
                        total: 6000,
                    },
                    {
                        type: ExposedItemType.Schools as unknown as Layer,
                        exposed: 2,
                        total: 9,
                    },
                    {
                        type: ExposedItemType.Clinics as unknown as Layer,
                        exposed: 1,
                        total: 5,
                    },
                ],
            },
        ],
        forecastSources: [ForecastSource.glofas, ForecastSource.ecmwf],
        firstIssuedAt: '2026-04-01T16:30:00Z',
        lastUpdatedAt: '2026-04-02T00:00:00Z',
        isOngoing: true,
    },
];
