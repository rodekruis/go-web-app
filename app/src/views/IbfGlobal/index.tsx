import { useTranslation } from '@ifrc-go/ui/hooks';

import { maptilerApiKey } from '#config';
import Map from "ol/Map";
import i18n from './i18n.json';
import { useEffect, useRef } from 'react';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View';

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const strings = useTranslation(i18n);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);
    const key = maptilerApiKey;
    const dataJson = `https://api.maptiler.com/maps/019c41d2-17c7-7e5e-9a47-d3b3f9515a5b/style.json?key=${key}`;

    useEffect(() => {
        // Only create map if the container exists and map hasn't been created
        if (mapRef.current && !mapInstanceRef.current) {
            mapInstanceRef.current = new Map({
                target: mapRef.current,
                layers: [
                    new TileLayer({
                        source: new OSM(),
                    }),
                ],
                view: new View({
                    center: [0, 0],
                    zoom: 2,
                }),
            });
        }

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.setTarget(undefined);
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return (

        <div        
            style={{
                justifyContent: 'center',
                display: 'flex',

            }}>
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

Component.displayName = 'IBF';
