import {
    type AlertClassType,
    type EventAdminAreaData,
    type EventOverviewData,
    ExposedItemType,
    type ExposureCategory,
    type MapLayerDetails,
    MapLayerInfoType,
    MeasurementUnits,
} from './nrwMapTypes';
import {
    type EventResponseDto,
    type ExposedAdminAreaDto,
} from './shared-dtos';
import {
    type ForecastSource,
    type HazardType,
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
        { itemType: ExposedItemType; unit: MeasurementUnits }
    >> = {
        [MapLayerInfoType.Population]: {
            itemType: ExposedItemType.Population,
            unit: MeasurementUnits.None,
        },
        [MapLayerInfoType.Clinics]: {
            itemType: ExposedItemType.Clinics,
            unit: MeasurementUnits.Locations,
        },
    };

    const mapping = layerMapping[type] ?? {
        itemType: ExposedItemType.Population,
        unit: MeasurementUnits.None,
    };

    return {
        type: mapping.itemType,
        unit: mapping.unit,
        exposed,
        total: total ?? 0, // TODO: handle null total values better
    };
}

function mapExposedAdminAreas(areas: ExposedAdminAreaDto[]): EventAdminAreaData[] {
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
        alertClass: dto.alertClass as AlertClassType,
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
