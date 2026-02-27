import { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import VectorTile from 'ol/source/VectorTile';
import VectorTileLayer from 'ol/layer/VectorTile';
import BaseLayer from 'ol/layer/Base';
import MVT from 'ol/format/MVT';
import 'ol/ol.css';
import ImageLayer from 'ol/layer/Image';
import ImageStatic from 'ol/source/ImageStatic';


import { maptilerApiKey, rasterImageDir } from '#config';
import { testStyle } from '#utils/ibfMapStyles';
import { Style } from 'ol/style';
import { OlDataMap } from './OlDataMap';
import { IbfControlPanel } from './IbfControlPanel';
import { IbfDataPanel } from './IbfDataPanel';
import { OlGlobalMap } from './OlGlobalMap';


const key = maptilerApiKey;
const countryVectors2 = `https://api.maptiler.com/tiles/countries/{z}/{x}/{y}.pbf?key=${key}`;
//const baseMapSimpleVectorStyle = `https://api.maptiler.com/maps/019c41d2-17c7-7e5e-9a47-d3b3f9515a5b/style.json?key=${key}`;
const baseMapSimpleVectorStyle = `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${key}`;

const testImageName = `flood_map_ZMB_RP20_c0_b3857`;

const getTestImagePng = (name : string) => {
    return `${rasterImageDir}${name}.png`;
}

const getTestImageExtents = (name : string) => {
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
const getMvtLayer = (selectedCountry: string,
    mapStyle: (feature: any, selected: string) => Style) => {
    return new VectorTileLayer({
        source: new VectorTile({
            url: countryVectors2,
            format: new MVT(),
            maxZoom: 2,
        }),
        style: (feature) => mapStyle(feature, selectedCountry),
    });
}

const getStaticImageLayerFromName = async (name: string) => {
    const extents = await getTestImageExtents(name);
    return new ImageLayer({
        source: new ImageStatic({
            url: getTestImagePng(name),
                projection: 'EPSG:3857',
                interpolate: false,
            imageExtent: extents,
        }),
    });
}



export function IbfMapContainer() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize state directly from URL to avoid race condition
    const initialCountryCode = searchParams.get('c')?.toUpperCase() || 'None';
    const [selectedCountry, setSelectedCountry] = useState<string>(initialCountryCode);
    const [isImageLayerLoading, setIsImageLayerLoading] = useState(false);
    const [isImageLayerLoaded, setIsImageLayerLoaded] = useState(false);
    const [isImageLayerVisible, setIsImageLayerVisible] = useState(false);

    // Store addLayer function from OlDataMap
    const addLayerRef = useRef<((layer: BaseLayer) => void) | null>(null);
    // Cache the loaded image layer
    const imageLayerRef = useRef<BaseLayer | null>(null);

    const handleMapReady = useCallback((addLayer: (layer: BaseLayer) => void) => {
        addLayerRef.current = addLayer;
    }, []);

    const handleToggleImageLayer = useCallback(() => {
        // If layer is already loaded, just toggle visibility
        if (imageLayerRef.current) {
            const newVisibility = !isImageLayerVisible;
            imageLayerRef.current.setVisible(newVisibility);
            setIsImageLayerVisible(newVisibility);
            return;
        }

        // First time: load the layer
        if (!addLayerRef.current) {
            console.error('Map not ready yet');
            return;
        }
        setIsImageLayerLoading(true);
        getStaticImageLayerFromName(testImageName)
            .then(imageLayer => {
                imageLayerRef.current = imageLayer;
                addLayerRef.current?.(imageLayer);
                setIsImageLayerLoaded(true);
                setIsImageLayerVisible(true);
                console.log('Added static image layer to map');
            })
            .catch(error => {
                console.error('Error loading static image layer:', error);
            })
            .finally(() => {
                setIsImageLayerLoading(false);
            });
    }, [isImageLayerVisible]);

    const handleLayerChange = useCallback((country: string) => {
        setSelectedCountry(country);

        if (country) {
            setSearchParams({ c: country });
        } else {
            setSearchParams({});
        }

    }, [setSearchParams]);

    return (
        <div>
            <OlDataMap
                selectedCountry={selectedCountry}
                layer={getMvtLayer(selectedCountry, testStyle)}
                mapStyleJsonUri={baseMapSimpleVectorStyle}
                onMapReady={handleMapReady}
            />
            <IbfControlPanel
                onToggleImageLayer={handleToggleImageLayer}
                isLoading={isImageLayerLoading}
                isLayerLoaded={isImageLayerLoaded}
                isLayerVisible={isImageLayerVisible}
            />
            <IbfDataPanel selectedCountry={selectedCountry} />

            <OlGlobalMap adminLevels={0} onSelect={handleLayerChange} />
        </div>
    );
}
