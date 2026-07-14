/**
 * DTOs from the IBF backend.
 * To update:
 * Ask an LLM to do the following prompt. You must run it from within the IBF repo.
 * You can then copy the output into the other repo manually, or make a commit from this repo.
 * LLM instructions:
 * - Do not edit this top header comment unless an error is seen in it.
 * - Look at the source DTOs listed below and update the shared interfaces as needed.
 * - Also include relevant comments from the source DTOs in this file
 *
 * Source DTOs:
 * - services/api-service/src/events/dto/event-exposed-admin-area.dto.ts
 * - services/api-service/src/events/dto/event-response.dto.ts
 * - services/api-service/src/events/dto/layer.dto.ts
 */

import type {
    AlertClass,
    ForecastSource,
    HazardType,
    LayerName,
    LayerType,
} from './shared-enums';

export interface AdminAreaExposureDto {
    layerName: LayerName;
    total: number | null;
    exposed: number;
}

export interface ExposedAdminAreaDto {
    placeCode: string;
    adminLevel: number;
    name: string;
    exposure: AdminAreaExposureDto[];
}

export interface EventResponseDto {
    eventId: number;
    countryCodeIso3: string;
    eventName: string;
    eventLabel: string;
    hazardType: HazardType;
    forecastSources: ForecastSource[];
    alertClass: AlertClass;
    trigger: boolean;
    centroid: {
        latitude: number;
        longitude: number;
    };
    startAt: string;
    reachesPeakAlertClassAt: string;
    endAt: string;
    firstIssuedAt: string;
    lastUpdatedAt: string;
    isOngoing: boolean;
    // A mapping of admin level (as a string key) to the exposed admin areas for that level
    exposedAdminAreas: Record<string, ExposedAdminAreaDto[]>;
    availableLayers: LayerDto[];
}

export interface LayerDto {
    // ID that can be used to fetch the actual map layer data
    resourceId: string;
    // The type of data on this layer. Used to label and style the layer in the UI.
    layerName: LayerName;
    // The way this data will be displayed
    layerType: LayerType;
}
