import {
    type EventOverviewData,
    type ExposureCategory,
    type MapLayerDetails,
} from './nrwMapTypes';
import {
    type EventResponseDto,
    type ExposedAdminAreaDto,
} from './shared-dtos';
import {
    type AlertClass,
    type ForecastSource,
    type HazardType,
    MapLayerInfoType,
} from './shared-enums';

// This file makes any necessary mappings from BE to FE data structures.
// TODO: align the data structures better, thereby removing the need for this file.

function mapLayerToExposureCategory(
    type: MapLayerInfoType,
    exposed: number,
    total: number | null,
): ExposureCategory {
    const layerMapping: Partial<Record<
        MapLayerInfoType,
        { itemType: MapLayerInfoType }
    >> = {
        [MapLayerInfoType.Population]: {
            itemType: MapLayerInfoType.Population,
        },
        [MapLayerInfoType.Clinics]: {
            itemType: MapLayerInfoType.Clinics,
        },
    };

    const mapping = layerMapping[type] ?? {
        itemType: MapLayerInfoType.Population,
    };

    return {
        type: mapping.itemType,
        exposed,
        total: total ?? 0, // TODO: handle null total values better
    };
}

function mapExposedAdminAreas(areas: ExposedAdminAreaDto[]): ExposedAdminAreaDto[] {
    return areas.map((area) => ({
        placeCode: area.placeCode,
        adminLevel: area.adminLevel,
        name: area.name,
        exposure: area.exposure.map(
            (exp) => mapLayerToExposureCategory(
                exp.type,
                exp.exposed,
                exp.total,
            ),
        ),
    }));
}

function mapAvailableLayers(
    layers: EventResponseDto['availableLayers'],
): MapLayerDetails[] {
    return layers.map((layer) => ({
        resourceId: layer.resourceId,
        dataType: layer.dataType,
        displayType: layer.displayType,
    }));
}

export function mapEventResponseToOverview(dto: EventResponseDto): EventOverviewData {
    return {
        hazardType: dto.hazardType as HazardType,
        eventName: dto.eventName,
        eventLabel: dto.eventLabel,
        eventId: dto.eventId,
        alertClass: dto.alertClass as AlertClass,
        trigger: dto.trigger,
        centroid: [dto.centroid.longitude, dto.centroid.latitude],
        startAt: dto.startAt,
        endAt: dto.endAt,
        reachesPeakAlertClassAt: dto.reachesPeakAlertClassAt,
        firstIssuedAt: dto.firstIssuedAt,
        lastUpdatedAt: dto.lastUpdatedAt,
        exposedAdminAreas: mapExposedAdminAreas(dto.exposedAdminAreas),
        availableLayers: mapAvailableLayers(dto.availableLayers),
        forecastSources: dto.forecastSources as ForecastSource[],
        isOngoing: dto.isOngoing,
    };
}

export function mapEventResponsesToOverviews(dtos: EventResponseDto[]): EventOverviewData[] {
    return dtos.map(mapEventResponseToOverview);
}
