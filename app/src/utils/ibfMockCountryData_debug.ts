import {
    type MapLayerDetails,
    MapLayerDisplayType,
    MapLayerInfoType,
} from '#utils/ibfMapTypes';

// Mock country map data for countries. This will be moved to the backend in the future.
export default {
    MWI: [
        { resourceId: '', dataType: MapLayerInfoType.Population, displayType: MapLayerDisplayType.Raster },
    ],
    KEN: [
        { resourceId: '', dataType: MapLayerInfoType.Population, displayType: MapLayerDisplayType.Raster },
    ],
    ZMB: [
        { resourceId: '', dataType: MapLayerInfoType.Population, displayType: MapLayerDisplayType.Raster },
    ],
} as Record<string, MapLayerDetails[]>;
