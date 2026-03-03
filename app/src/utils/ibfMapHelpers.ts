import { rasterImageDir } from '#config';
import VectorTileLayer from 'ol/layer/VectorTile';
import MVT from 'ol/format/MVT';
import ImageLayer from 'ol/layer/Image';
import ImageStatic from 'ol/source/ImageStatic';
import { MvtStyleCreator } from './ibfMapStyles';
import VectorTile from 'ol/source/VectorTile';

// Debug file for raster testing.
// This will be removed once the dev test flow is set up.
export const debug_testImageName = `flood_map_ZMB_RP20_c0_b3857`;

export const getRasterDataPng = (name : string) => {
    // Currently this only supports the debug dev flow.
    // The logic will be added to later to support the actual meta data flow.
    
    // For now, return a png for the local raster image dir.
    return `${rasterImageDir}${name}.png`;
}

// Fetch the image extents from the meta data for a raster image.
export const getImageExtentsAsync = (name : string) => {
    // Currently this only supports the debug dev flow.
    // The logic will be added to later to support the actual meta data flow.

    const jsonData = `${rasterImageDir}${name}.json`;
    // fetch json and get the extents from it
    return fetch(jsonData)
        .then(response => response.json())
        .then(data => {
            if (data && data.bounds) {
                const { left, bottom, right, top } = data.bounds;
                return [left, bottom, right, top];
            } else {
                throw new Error('Invalid JSON structure: missing "bounds" property');
            }
        })
        .catch(error => {
            console.error('Error loading image extents:', error);
            // Return default extents or handle as needed
            return [0, 0, 0, 0];
        });
}

// Create layer for OlDataMap
export const makeMvtLayerAsync = (
    selectedCountry: string,
    mapVectorTileUrl: string,
    getMapStyle: MvtStyleCreator
) => {
    return new VectorTileLayer({
        source: new VectorTile({
            url: mapVectorTileUrl,
            format: new MVT(),
            maxZoom: 2,
        }),
        style: (feature) => getMapStyle(feature, selectedCountry),
    });
}

export const makeStaticImageLayer = async (name: string) => {
    const extents = await getImageExtentsAsync(name);
    const rasterData = await getRasterDataPng(name);
    return new ImageLayer({
        source: new ImageStatic({
            url: rasterData,
            projection: 'EPSG:3857',
            interpolate: false,
            imageExtent: extents,
        }),
    });
}