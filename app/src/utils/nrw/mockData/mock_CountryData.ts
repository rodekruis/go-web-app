// 2026-06-11: Not used right now; because we're using JSON from the seed repo.
// However, this file will help when we change the format when the backend is
// hooked up. After that: this will be part of tests.

import {
    type CountryMapData,
    EventDataSources,
} from '../nrwMapTypes';
import {
    LayerName,
    MapLayerDisplayType,
} from '../shared-enums';

// Mock country map data for countries.
export default {
    MWI: {
        availableLayers: [
            {
                resourceId: LayerName.population,
                dataType: LayerName.population,
                displayType: MapLayerDisplayType.Raster,
            },
            {
                resourceId: LayerName.redCrossBranches,
                dataType: LayerName.redCrossBranches,
                displayType: MapLayerDisplayType.Point,
            },
        ],
        supportedEventDataSources: [EventDataSources.Nrw],
    },
    KEN: {
        availableLayers: [
            {
                resourceId: LayerName.population,
                dataType: LayerName.population,
                displayType: MapLayerDisplayType.Raster,
            },
            {
                resourceId: LayerName.redCrossBranches,
                dataType: LayerName.redCrossBranches,
                displayType: MapLayerDisplayType.Point,
            },
            {
                resourceId: LayerName.clinics,
                dataType: LayerName.clinics,
                displayType: MapLayerDisplayType.Point,
            },
        ],
        supportedEventDataSources: [],
    },
    ZMB: {
        availableLayers: [
            {
                resourceId: LayerName.population,
                dataType: LayerName.population,
                displayType: MapLayerDisplayType.Raster,
            },
        ],
        supportedEventDataSources: [EventDataSources.Nrw],
    },
    PHL: {
        availableLayers: [
            {
                resourceId: LayerName.population,
                dataType: LayerName.population,
                displayType: MapLayerDisplayType.Raster,
            },
            {
                resourceId: LayerName.redCrossBranches,
                dataType: LayerName.redCrossBranches,
                displayType: MapLayerDisplayType.Point,
            },
            {
                resourceId: LayerName.clinics,
                dataType: LayerName.clinics,
                displayType: MapLayerDisplayType.Point,
            },
        ],
        supportedEventDataSources: [],
    },
    ETH: {
        availableLayers: [
            {
                resourceId: LayerName.population,
                dataType: LayerName.population,
                displayType: MapLayerDisplayType.Raster,
            },
        ],
        supportedEventDataSources: [],
    },
    LSO: {
        availableLayers: [
            {
                resourceId: LayerName.population,
                dataType: LayerName.population,
                displayType: MapLayerDisplayType.Raster,
            },
            {
                resourceId: LayerName.redCrossBranches,
                dataType: LayerName.redCrossBranches,
                displayType: MapLayerDisplayType.Point,
            },
            {
                resourceId: LayerName.clinics,
                dataType: LayerName.clinics,
                displayType: MapLayerDisplayType.Point,
            },
        ],
        supportedEventDataSources: [],
    },
    SSD: {
        availableLayers: [
            {
                resourceId: LayerName.population,
                dataType: LayerName.population,
                displayType: MapLayerDisplayType.Raster,
            },
            {
                resourceId: LayerName.redCrossBranches,
                dataType: LayerName.redCrossBranches,
                displayType: MapLayerDisplayType.Point,
            },
            {
                resourceId: LayerName.clinics,
                dataType: LayerName.clinics,
                displayType: MapLayerDisplayType.Point,
            },
        ],
        supportedEventDataSources: [],
    },
    UGA: {
        availableLayers: [
            {
                resourceId: LayerName.population,
                dataType: LayerName.population,
                displayType: MapLayerDisplayType.Raster,
            },
        ],
        supportedEventDataSources: [],
    },
    ZWE: {
        availableLayers: [
            {
                resourceId: LayerName.population,
                dataType: LayerName.population,
                displayType: MapLayerDisplayType.Raster,
            },
            {
                resourceId: LayerName.redCrossBranches,
                dataType: LayerName.redCrossBranches,
                displayType: MapLayerDisplayType.Point,
            },
        ],
        supportedEventDataSources: [],
    },
} as Record<string, CountryMapData>;
