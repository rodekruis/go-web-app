import { useEffect, useRef } from 'react';
import Map from 'ol/Map.js';
import styles from './styles.module.css';
import { View } from 'ol';
import { fromLonLat } from 'ol/proj';
import VectorTile from 'ol/source/VectorTile';
import VectorTileLayer from 'ol/layer/VectorTile';
import Attribution from 'ol/control/Attribution.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import MVT from 'ol/format/MVT';
import 'ol/ol.css';
import { CountryData, mapUrlCountryVectorTiles } from '#utils/ibfMap';
import { styleMvtGreyWorldMap } from '#utils/ibfMapStyles';

// Initial zoom/focus of map
const center = [0, 0];
const zoom = 2;

interface OlGlobalMapProps {
    adminLevels: 0 | 1;
    onSelect: (country: string) => void;
}

export function OlGlobalMap({ adminLevels: adminLayers, onSelect }: OlGlobalMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);
    const vAdmin0Ref = useRef<VectorTileLayer | null>(null);

    let selectedCountry = '';

    // By setting the max zoom of the vector tiles layer, we can control what vectors are drawn.
    // It supports all countries at admin0 (at zoom 1) and admin1 (at zoom 2+).
    const countryLayerMaxZoom = adminLayers + 1;

    // Map init called once
    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            const attribution = new Attribution({ collapsible: false });

            // Create layers with current selectedCountry in closure
            vAdmin0Ref.current = new VectorTileLayer({
                source: new VectorTile({
                    url: mapUrlCountryVectorTiles,
                    format: new MVT(),
                    maxZoom: countryLayerMaxZoom,
                }),
                style: (feature) => styleMvtGreyWorldMap(feature, selectedCountry),
            });

            mapInstanceRef.current = new Map({
                target: mapRef.current,
                controls: defaultControls({ attribution: false }).extend([attribution]),
                layers: [vAdmin0Ref.current],
                view: new View({
                    constrainResolution: true,
                    center,
                    zoom,
                    maxZoom: 6,
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
                    const newSelectedCountry = properties['iso_a2'] || '';

                    if (selectedCountry != newSelectedCountry) {
                        onSelect(newSelectedCountry);

                        // Zoom to country
                        const countryInfo = CountryData.get(newSelectedCountry);
                        if (countryInfo) {
                            const [lat, lon] = countryInfo.latlon;
                            mapInstanceRef.current!.getView().animate({
                                center: fromLonLat([lon, lat]),
                                zoom: countryInfo.initialZoom,
                                duration: 500, // animation in ms
                            });
                        }
                    } else {
                        onSelect('');
                    }

                    console.log('Clicked country:', newSelectedCountry);
                    selectedCountry = newSelectedCountry;
                    vAdmin0Ref.current!.setStyle((feature) => styleMvtGreyWorldMap(feature, selectedCountry));

                    return true;
                });
            });
        }

        // Clean up
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
