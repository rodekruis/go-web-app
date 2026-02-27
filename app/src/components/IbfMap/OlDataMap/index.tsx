import { useEffect, useRef } from 'react';
import Map from 'ol/Map.js';
import { View } from 'ol';
import { fromLonLat } from 'ol/proj';
import BaseLayer from 'ol/layer/Base';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import { CountryData } from '#utils/ibfMap';
import { apply } from 'ol-mapbox-style';

import styles from './styles.module.css';

/*
const getBaseStyleJson = (styleJsonUrl: string, targetMap: Map) => {

    // Fetch and customize the style
    fetch(styleJsonUrl)
        .then(response => response.json())
        .then(style => {
            console.log('Glyphs URL:', style.glyphs);
                const labelLayers = style.layers.filter((l: any) => l.type === 'symbol');
    console.log('Label layers:', labelLayers);
    // Check minzoom, visibility, text-size, text-opacity etc.
    

            console.log('Style sources:', Object.keys(style.sources || {}));
            console.log('Available layers:', style.layers.map((l: any) => ({
                id: l.id,
                sourceLayer: l['source-layer'],
                type: l.type,
                source: l.source
            })));


            // Apply the modified style
            // 'as any' needed due to library mismatch making eslint complain
            apply(targetMap as any, styleJsonUrl)//style)
                .then(() => {
                    console.log('Style applied successfully');
                })
                .catch((error: any) => {
                    console.error('Style apply error:', error);
                });
        })
        .catch(error => {
            console.error('Error loading style:', error);
        });
}*/

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

    // defaul zoom and focus
    let center = [0, 0];
    let zoom = 2;

    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {

            if (countryInfo) {
                center = fromLonLat([countryInfo.latlon[1], countryInfo.latlon[0]]);
                zoom = countryInfo.initialZoom;
            }

            mapInstanceRef.current = new Map({
                target: mapRef.current,
                controls: defaultControls({ attribution: false }),

                view: countryInfo ? new View({
                    center,
                    zoom,
                    // Constrain where the user can pan to
                    extent: countryInfo.safeExtents,
                    // The center of the country can't be panned off the view, rather than the edge
                    constrainOnlyCenter: true,
                }) : new View({
                    center,
                    zoom,
                }),
            });


            if (mapStyleJsonUri) {
                // using 'as any' due to a library mismatch that causes eslint to complain
                //getBaseStyleJson(mapStyleJsonUri, mapInstanceRef.current as any);
                apply(mapInstanceRef.current as any, mapStyleJsonUri)
                    .then(() => {
                        console.log('Style applied successfully');
                    })
                    .catch((error: any) => {
                        console.error('Style apply error:', error);
                    });
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
    }, []);

    return (
        <div className={styles.container}>
            <div
                ref={mapRef}
                className={styles.map}
            />
        </div>
    );
}