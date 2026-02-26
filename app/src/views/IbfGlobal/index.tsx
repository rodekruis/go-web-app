import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Map from 'ol/Map.js';
import { View } from 'ol';
import { fromLonLat } from 'ol/proj';
import VectorTile from 'ol/source/VectorTile';
import VectorTileLayer from 'ol/layer/VectorTile';
import Attribution from 'ol/control/Attribution.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import { Fill, Stroke, Style } from 'ol/style';
import MVT from 'ol/format/MVT';
import 'ol/ol.css';

import { maptilerApiKey } from '#config';
import { CountryData } from '#utils/ibfMap';

const key = maptilerApiKey;
const countryVectors2 = `https://api.maptiler.com/tiles/countries/{z}/{x}/{y}.pbf?key=${key}`;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [searchParams, setSearchParams] = useSearchParams();
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);
    const vAdmin0Ref = useRef<VectorTileLayer | null>(null);
    const vAdmin1Ref = useRef<VectorTileLayer | null>(null);

    const countryCode = searchParams.get('c');
    const initialCountry = countryCode ? CountryData.get(countryCode.toUpperCase()) : undefined;
    const [selectedCountry, setSelectedCountry] = useState<string>(countryCode?.toUpperCase() ?? 'None');

    const { center, zoom } = useMemo(() => {
        if (initialCountry) {
            return {
                center: fromLonLat([initialCountry.latlon[1], initialCountry.latlon[0]]),
                zoom: initialCountry.initialZoom,
            };
        }
        return { center: [0, 0], zoom: 2 };
    }, [initialCountry]);

    // Style function for admin0 layer
    const getAdmin0Style = useCallback((feature: any, selected: string) => {
        const iso_a2 = feature.get('iso_a2');
        const isSelected = iso_a2 === selected;
        const countryInfo = CountryData.get(iso_a2);
        const isIbfSupported = countryInfo?.ibfSupported ?? false;

        let fillColor: string;
        if (isIbfSupported) {
            fillColor = isSelected ? "#d63384" : "#f8bbd9";
        } else {
            fillColor = isSelected ? "#b3b3b3" : "#e0e0e0";
        }

        return new Style({
            fill: new Fill({ color: fillColor }),
            stroke: new Stroke({ color: "#a4a4a4", width: 1 }),
        });
    }, []);

    // Style function for admin1 layer
    const getAdmin1Style = useCallback((feature: any, selected: string) => {
        const iso_a2 = feature.get('iso_a2');
        const isSelected = iso_a2 === selected;
        const fillColor = isSelected ? "#e0e0e0" :"#b3b3b3";

        return new Style({
            fill: new Fill({ color: fillColor }),
            stroke: new Stroke({ color: "#a4a4a4", width: 1 }),
        });
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
                style: (feature) => getAdmin0Style(feature, selectedCountry),
            });

            vAdmin1Ref.current = new VectorTileLayer({
                source: new VectorTile({
                    url: countryVectors2,
                    format: new MVT(),
                    maxZoom: 2,
                }),
                visible: false,
                style: (feature) => getAdmin1Style(feature, selectedCountry),
            });

            mapInstanceRef.current = new Map({
                target: mapRef.current,
                controls: defaultControls({ attribution: false }).extend([attribution]),
                layers: [vAdmin0Ref.current, vAdmin1Ref.current],
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
                    const clickedCountry = properties['iso_a2'] || 'Unknown';

                    setSelectedCountry(clickedCountry);

                    const countryInfo = CountryData.get(clickedCountry);
                    if (countryInfo) {
                        const [lat, lon] = countryInfo.latlon;
                        mapInstanceRef.current!.getView().animate({
                            center: fromLonLat([lon, lat]),
                            zoom: countryInfo.initialZoom,
                            duration: 500,
                        });
                    }

                    // Toggle layers
                    if (vAdmin0Ref.current && vAdmin1Ref.current) {
                        const admin0Visible = vAdmin0Ref.current.getVisible();
                        const goingToAdmin1 = admin0Visible;

                        vAdmin0Ref.current.setVisible(!admin0Visible);
                        vAdmin1Ref.current.setVisible(admin0Visible);

                        // Update URL: add country code when zooming in, remove when zooming out
                        if (goingToAdmin1 && clickedCountry !== 'Unknown') {
                            setSearchParams({ c: clickedCountry });
                        } else {
                            setSearchParams({});
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
            vAdmin0Ref.current.setStyle((feature) => getAdmin0Style(feature, selectedCountry));
        }
        if (vAdmin1Ref.current) {
            vAdmin1Ref.current.setStyle((feature) => getAdmin1Style(feature, selectedCountry));
        }
    }, [selectedCountry, getAdmin0Style, getAdmin1Style]);

    return (
        <div
            style={{
                justifyContent: 'center',
                display: 'flex',
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

Component.displayName = 'IBF';

