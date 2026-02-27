import { useEffect, useMemo, useRef } from 'react';
import Map from 'ol/Map.js';
import { View } from 'ol';
import { fromLonLat } from 'ol/proj';
import BaseLayer from 'ol/layer/Base';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import { CountryData } from '#utils/ibfMap';
import { apply } from 'ol-mapbox-style';

import styles from './styles.module.css';


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

interface OlDataMapProps {
    selectedCountry: string;
    layer?: BaseLayer;
    mapStyleJsonUri?: string;
    onMapReady?: (addLayer: (layer: BaseLayer) => void) => void;
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