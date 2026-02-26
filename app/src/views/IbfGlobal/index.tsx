import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Map from 'ol/Map.js';
import { View } from 'ol';
import { fromLonLat } from 'ol/proj';
import VectorTile from 'ol/source/VectorTile';
import VectorTileLayer from 'ol/layer/VectorTile';
import BaseLayer from 'ol/layer/Base';
import Attribution from 'ol/control/Attribution.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import MVT from 'ol/format/MVT';
import 'ol/ol.css';
import ImageLayer from 'ol/layer/Image';
import ImageStatic from 'ol/source/ImageStatic';


import { maptilerApiKey, rasterImageDir } from '#config';
import { CountryData } from '#utils/ibfMap';
import { globalGreyStyle, zoomedGreyStyle, testStyle } from '#utils/ibfMapStyles';
import { Style } from 'ol/style';
import { apply } from 'ol-mapbox-style';

const key = maptilerApiKey;
const countryVectors2 = `https://api.maptiler.com/tiles/countries/{z}/{x}/{y}.pbf?key=${key}`;
const baseMapSimpleVectorStyle = `https://api.maptiler.com/maps/019c41d2-17c7-7e5e-9a47-d3b3f9515a5b/style.json?key=${key}`;

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

const getBaseStyleJson = (styleJsonUrl: string, targetMap: Map) => {

    // Fetch and customize the style
    fetch(styleJsonUrl)
        .then(response => response.json())
        .then(style => {
            console.log('Style sources:', Object.keys(style.sources || {}));
            console.log('Available layers:', style.layers.map((l: any) => ({
                id: l.id,
                sourceLayer: l['source-layer'],
                type: l.type,
                source: l.source
            })));

            // Does this really work for perf? 
            style.layers.forEach((layer: any) => {
                if (layer.type === 'line') {
                    layer.paint = layer.paint || {};
                    layer.layout = layer.layout || {};
                    layer.layout['line-cap'] = 'butt'; // Faster than 'round'
                    layer.layout['line-join'] = 'miter'; // Faster than 'round'
                }
            });

            // Apply the modified style
            // 'as any' needed due to library mismatch making eslint complain
            apply(targetMap as any, style);
        })
        .catch(error => {
            console.error('Error loading style:', error);
        });
}

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export

export type MapLayer = 'admin0' | 'admin1';

interface OlMapProps {
    activeLayer: MapLayer;
    selectedCountry: string;
    onLayerChange: (layer: MapLayer, country: string) => void;
}

interface OlDataMapProps {
    selectedCountry: string;
    layer?: BaseLayer;
    mapStyleJsonUri?: string;
    onMapReady?: (addLayer: (layer: BaseLayer) => void) => void;
}

interface IbfControlPanelProps {
    onToggleImageLayer: () => void;
    isLoading: boolean;
    isLayerLoaded: boolean;
    isLayerVisible: boolean;
}

interface IbfDataPanelProps {
    selectedCountry: string;
}

// Component is the route entry point
export function Component() {
    return <IbfMapContainer />;
}

Component.displayName = 'IbfGlobal';

/////////////////////////////
////////////////////////////
//////////////////////////////

export function IbfMapContainer() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize state directly from URL to avoid race condition
    const initialCountryCode = searchParams.get('c')?.toUpperCase() || 'None';
    const [activeLayer, setActiveLayer] = useState<MapLayer>(initialCountryCode !== 'None' ? 'admin1' : 'admin0');
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

    const handleLayerChange = useCallback((layer: MapLayer, country: string) => {
        setActiveLayer(layer);
        setSelectedCountry(country);

        if (layer === 'admin1' && country !== 'Unknown') {
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
            <OlMap
                activeLayer={activeLayer}
                selectedCountry={selectedCountry}
                onLayerChange={handleLayerChange}
            />
        </div>
    );
}

export function IbfDataPanel({ selectedCountry }: IbfDataPanelProps) {
    if (selectedCountry === 'None') {
        return (
            <div style={{ padding: '10px' }}>
                <p><strong>None selected</strong></p>
            </div>
        );
    }

    const countryInfo = CountryData.get(selectedCountry);
    if (!countryInfo) {
        return (
        <div style={{ padding: '10px' }}>
            <p><strong>{selectedCountry}</strong></p>
            <p>Error. Name not found.</p>
        </div>
        );
    }

    return (
        <div style={{ padding: '10px' }}>
            <p><strong>{countryInfo.name_en}</strong></p>
            <p>IBF Supported: {countryInfo.ibfSupported ? 'Yes' : 'No'}</p>
        </div>
    );
}

export function IbfControlPanel({ onToggleImageLayer, isLoading, isLayerLoaded, isLayerVisible }: IbfControlPanelProps) {
    let buttonText = 'Load Flood Map Layer';
    if (isLoading) {
        buttonText = 'Loading...';
    } else if (isLayerLoaded && isLayerVisible) {
        buttonText = 'Hide Flood Map Layer';
    } else if (isLayerLoaded && !isLayerVisible) {
        buttonText = 'Show Flood Map Layer';
    }

    return (
        <div style={{ padding: '10px', marginTop: '10px' }}>
            <button
                type="button"
                onClick={onToggleImageLayer}
                disabled={isLoading}
                style={{
                    padding: '8px 16px',
                    cursor: isLoading ? 'wait' : 'pointer',
                }}
            >
                {buttonText}
            </button>
        </div>
    );
}


export function OlMap({ activeLayer, selectedCountry, onLayerChange }: OlMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);
    const vAdmin0Ref = useRef<VectorTileLayer | null>(null);
    const vAdmin1Ref = useRef<VectorTileLayer | null>(null);

    // Set initial zoom/focus of map
    const initialCountry = selectedCountry !== 'None' ? CountryData.get(selectedCountry) : undefined;
    const { center, zoom } = useMemo(() => {
        if (initialCountry) {
            return {
                center: fromLonLat([initialCountry.latlon[1], initialCountry.latlon[0]]),
                zoom: initialCountry.initialZoom,
            };
        }
        return { center: [0, 0], zoom: 2 };
    }, []);



    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            const attribution = new Attribution({ collapsible: false });

            // Create layers with current selectedCountry in closure
            vAdmin0Ref.current = new VectorTileLayer({
                source: new VectorTile({
                    url: countryVectors2,
                    format: new MVT(),
                    maxZoom: 1,
                }),
                style: (feature) => globalGreyStyle(feature, selectedCountry),
            });

            vAdmin1Ref.current = new VectorTileLayer({
                source: new VectorTile({
                    url: countryVectors2,
                    format: new MVT(),
                    maxZoom: 2,
                }),
                visible: false,
                style: (feature) => zoomedGreyStyle(feature, selectedCountry),
            });

            //const hasCountry = selectedCountry !== 'None';

            mapInstanceRef.current = new Map({
                target: mapRef.current,
                controls: defaultControls({ attribution: false }).extend([attribution]),
                layers: [vAdmin0Ref.current, vAdmin1Ref.current],
                view: new View({
                    constrainResolution: true,
                    center,
                    zoom,
                    maxZoom: 6,
                    //extent: [-572513.341856, 5211017.966314, 916327.095083, 6636950.728974],

                }),
            });

            // Cursor change on hover
            mapInstanceRef.current.on('pointermove', (evt) => {
                const pixel = mapInstanceRef.current!.getEventPixel(evt.originalEvent);
                const hit = mapInstanceRef.current!.hasFeatureAtPixel(pixel);
                mapInstanceRef.current!.getTargetElement().style.cursor = hit ? 'pointer' : '';
            });

            // Click handler
            mapInstanceRef.current.on('click', (evt) => {
                mapInstanceRef.current!.forEachFeatureAtPixel(evt.pixel, (feature) => {
                    const properties = feature.getProperties();
                    const clickedCountry = properties['iso_a2'] || 'Unknown';

                    // Toggle layers
                    if (vAdmin0Ref.current && vAdmin1Ref.current) {
                        const admin0Visible = vAdmin0Ref.current.getVisible();
                        const goingToAdmin1 = admin0Visible;

                        vAdmin0Ref.current.setVisible(!admin0Visible);
                        vAdmin1Ref.current.setVisible(admin0Visible);

                        if (goingToAdmin1) {
                            // Zooming into country
                            onLayerChange('admin1', clickedCountry);
                            const countryInfo = CountryData.get(clickedCountry);
                            if (countryInfo) {
                                const [lat, lon] = countryInfo.latlon;
                                mapInstanceRef.current!.getView().animate({
                                    center: fromLonLat([lon, lat]),
                                    zoom: countryInfo.initialZoom,
                                    duration: 500,
                                });
                            }
                        } else {
                            // Zooming out to global
                            onLayerChange('admin0', 'None');
                        }
                    }

                    return true;
                });
            });
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.setTarget(undefined);
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [center, zoom]);

    // Update layer styles when selectedCountry changes
    useEffect(() => {
        if (vAdmin0Ref.current) {
            vAdmin0Ref.current.setStyle((feature) => globalGreyStyle(feature, selectedCountry));
        }
        if (vAdmin1Ref.current) {
            vAdmin1Ref.current.setStyle((feature) => zoomedGreyStyle(feature, selectedCountry));
        }
    }, [selectedCountry, globalGreyStyle, zoomedGreyStyle]);

    // Sync layer visibility with activeLayer prop
    useEffect(() => {
        if (vAdmin0Ref.current && vAdmin1Ref.current) {
            vAdmin0Ref.current.setVisible(activeLayer === 'admin0');
            vAdmin1Ref.current.setVisible(activeLayer === 'admin1');
        }
    }, [activeLayer]);

    return (
        <div
            style={{
                justifyContent: 'center',
                display: 'flex',
                marginTop: '20px',
            }}
        >
            <div
                ref={mapRef}
                style={{
                    width: '95%',
                    height: '800px',
                }}
            />
        </div>
    );
}

export function OlDataMap({ selectedCountry, layer, mapStyleJsonUri, onMapReady }: OlDataMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);

    const countryInfo = selectedCountry !== 'None' ? CountryData.get(selectedCountry) : undefined;

    console.log('Rendering OlDataMap with selectedCountry:', selectedCountry);

    const { center, zoom } = useMemo(() => {
        if (countryInfo) {
            return {
                center: fromLonLat([countryInfo.latlon[1], countryInfo.latlon[0]]),
                zoom: countryInfo.initialZoom,
            };
        }
        return { center: [0, 0], zoom: 2 };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            mapInstanceRef.current = new Map({
                target: mapRef.current,
                controls: defaultControls({ attribution: false }),
                //layers: [layer],

                view: countryInfo ? new View({
                    //constrainResolution: true, // disallow fractional zoom. This might be good ot use later for perf. Check
                    center,
                    zoom,
                    extent: countryInfo.safeExtents,
                    constrainOnlyCenter: true,
                }) : new View({
                    center,
                    zoom,

                }),
            });


            if (mapStyleJsonUri) {
                // 'as any' needed due to library mismatch making eslint complain
                getBaseStyleJson(mapStyleJsonUri, mapInstanceRef.current as any);
            }
            if (layer) {
                mapInstanceRef.current.addLayer(layer);
            }

            // Expose addLayer function to parent
            if (onMapReady) {
                onMapReady((newLayer: BaseLayer) => {
                    mapInstanceRef.current?.addLayer(newLayer);
                });
            }
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.setTarget(undefined);
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [center, zoom]);

    return (
        <div
            style={{
                justifyContent: 'center',
                display: 'flex',
                marginTop: '20px',
            }}
        >
            <div
                ref={mapRef}
                style={{
                    width: '95%',
                    height: '600px',
                }}
            />
        </div>
    );
}
