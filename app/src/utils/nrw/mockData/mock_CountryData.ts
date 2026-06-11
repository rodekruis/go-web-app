// 2026-06-11: Not used right now; because we're using JSON from the seed repo.
// However, this file will help when we change the format when the backend is
// hooked up. After that: this will be part of tests.

import {
    type CountryMapData,
    EventDataSources,
} from '../nrwMapTypes';
import {
    MapLayerDisplayType,
    MapLayerInfoType,
} from '../shared-enums';

// Mock country map data for countries.
export default {
    MWI: {
        availableLayers: [
            {
                resourceId: MapLayerInfoType.Population,
                dataType: MapLayerInfoType.Population,
                displayType: MapLayerDisplayType.Raster,
            },
            {
                resourceId: MapLayerInfoType.RedCrossBranches,
                dataType: MapLayerInfoType.RedCrossBranches,
                displayType: MapLayerDisplayType.Point,
            },
        ],
        supportedEventDataSources: [EventDataSources.Nrw],
    },
    KEN: {
        availableLayers: [
            {
                resourceId: MapLayerInfoType.Population,
                dataType: MapLayerInfoType.Population,
                displayType: MapLayerDisplayType.Raster,
            },
            {
                resourceId: MapLayerInfoType.RedCrossBranches,
                dataType: MapLayerInfoType.RedCrossBranches,
                displayType: MapLayerDisplayType.Point,
            },
            {
                resourceId: MapLayerInfoType.Clinics,
                dataType: MapLayerInfoType.Clinics,
                displayType: MapLayerDisplayType.Point,
            },
        ],
        supportedEventDataSources: [],
    },
    ZMB: {
        availableLayers: [
            {
                resourceId: MapLayerInfoType.Population,
                dataType: MapLayerInfoType.Population,
                displayType: MapLayerDisplayType.Raster,
            },
        ],
        supportedEventDataSources: [EventDataSources.Nrw],
    },
    PHL: {
        availableLayers: [
            {
                resourceId: MapLayerInfoType.Population,
                dataType: MapLayerInfoType.Population,
                displayType: MapLayerDisplayType.Raster,
            },
            {
                resourceId: MapLayerInfoType.RedCrossBranches,
                dataType: MapLayerInfoType.RedCrossBranches,
                displayType: MapLayerDisplayType.Point,
            },
            {
                resourceId: MapLayerInfoType.Clinics,
                dataType: MapLayerInfoType.Clinics,
                displayType: MapLayerDisplayType.Point,
            },
        ],
        supportedEventDataSources: [],
    },
    ETH: {
        availableLayers: [
            {
                resourceId: MapLayerInfoType.Population,
                dataType: MapLayerInfoType.Population,
                displayType: MapLayerDisplayType.Raster,
            },
        ],
        supportedEventDataSources: [],
    },
    LSO: {
        availableLayers: [
            {
                resourceId: MapLayerInfoType.Population,
                dataType: MapLayerInfoType.Population,
                displayType: MapLayerDisplayType.Raster,
            },
            {
                resourceId: MapLayerInfoType.RedCrossBranches,
                dataType: MapLayerInfoType.RedCrossBranches,
                displayType: MapLayerDisplayType.Point,
            },
            {
                resourceId: MapLayerInfoType.Clinics,
                dataType: MapLayerInfoType.Clinics,
                displayType: MapLayerDisplayType.Point,
            },
        ],
        supportedEventDataSources: [],
    },
    SSD: {
        availableLayers: [
            {
                resourceId: MapLayerInfoType.Population,
                dataType: MapLayerInfoType.Population,
                displayType: MapLayerDisplayType.Raster,
            },
            {
                resourceId: MapLayerInfoType.RedCrossBranches,
                dataType: MapLayerInfoType.RedCrossBranches,
                displayType: MapLayerDisplayType.Point,
            },
            {
                resourceId: MapLayerInfoType.Clinics,
                dataType: MapLayerInfoType.Clinics,
                displayType: MapLayerDisplayType.Point,
            },
        ],
        supportedEventDataSources: [],
    },
    UGA: {
        availableLayers: [
            {
                resourceId: MapLayerInfoType.Population,
                dataType: MapLayerInfoType.Population,
                displayType: MapLayerDisplayType.Raster,
            },
        ],
        supportedEventDataSources: [],
    },
    ZWE: {
        availableLayers: [
            {
                resourceId: MapLayerInfoType.Population,
                dataType: MapLayerInfoType.Population,
                displayType: MapLayerDisplayType.Raster,
            },
            {
                resourceId: MapLayerInfoType.RedCrossBranches,
                dataType: MapLayerInfoType.RedCrossBranches,
                displayType: MapLayerDisplayType.Point,
            },
        ],
        supportedEventDataSources: [],
    },
} as Record<string, CountryMapData>;
