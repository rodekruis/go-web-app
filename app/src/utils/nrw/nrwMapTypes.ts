// Data types and structures use for the Nrw Map components

import type {
    LayerSpecification,
    SourceSpecification,
} from 'mapbox-gl-v3';

import { type BaseLayerDto } from './shared-dtos';

// A zoom/center pair describing the current map view
export interface MapViewParameters {
    zoom: number;
    center: {
        lon: number;
        lat: number;
    };
}

// A Mapbox layer set with the data source and its render layer.
// Mapbox keeps the data source and render layer as separate objects.
export interface NrwMapboxLayer {
    sourceId: string;
    renderLayerId: string;
    source: SourceSpecification;
    layer: LayerSpecification;
}

// An added map layer tracked by its layer id and draw order.
// Mapbox uses an ordered list to determine draw order.
export interface OrderedMapLayer {
    renderLayerId: string;
    drawOrder: number;
}

// Functions exposed by the map component so the data loader can manage layers.
export interface MapLayerFunctions {
    // Add a prepared layer (source + layer) to the map, ordered by the layer details
    addLayer: (layer: NrwMapboxLayer, layerInfo: BaseLayerDto) => void;
    // Show or hide a layer that was previously added to the map
    setLayerVisibility: (layer: NrwMapboxLayer, visible: boolean) => void;
}

// Extents for the raster metadata
export interface RasterSpatialExtent {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
}

// Metadata for a raster image from the IBF API
export interface RasterMetadataResponse {
    metadata: {
        coloured: {
            extent: RasterSpatialExtent;
        };
    };
}
