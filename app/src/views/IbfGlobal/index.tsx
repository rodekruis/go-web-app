import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
//import { useTranslation } from '@ifrc-go/ui/hooks';
//import i18n from './i18n.json';

import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile.js';
import { maptilerApiKey } from '#config';
import { CountryData } from '#utils/ibfMap';
import VectorTile from 'ol/source/VectorTile';
import VectorTileLayer from 'ol/layer/VectorTile';
import { View } from 'ol';
import { fromLonLat } from 'ol/proj';
import Map from 'ol/Map.js';
import Attribution from 'ol/control/Attribution.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import 'ol/ol.css';
import { Fill, Stroke, Style } from 'ol/style';
import MVT from 'ol/format/MVT';

const key = maptilerApiKey;
// const dataJson = `https://api.maptiler.com/maps/019c41d2-17c7-7e5e-9a47-d3b3f9515a5b/style.json?key=${key}`;

const countryVectors2 = `https://api.maptiler.com/tiles/country-vectors/tiles.json?key=${key}`;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    //const strings = useTranslation(i18n);
    const [searchParams] = useSearchParams();
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);
    const countryCode = searchParams.get('c');
    const country = countryCode ? CountryData.get(countryCode.toUpperCase()) : undefined;

    const { center, zoom } = useMemo(() => {
        if (country) {
            return {
                center: fromLonLat([country.latlong[1], country.latlong[0]]),
                zoom: country.initialZoom,
            };
        }
        return { center: [0, 0], zoom: 2 };
    }, [country]);

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
                    center,
                    zoom,
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



export class MtCountryTest {
    private map!: Map;
    selectedCountry = 'None';

    vlayer!: VectorTileLayer;

    vAdmin0 = new VectorTileLayer({
        source: new VectorTile({
            url: countryVectors2,
            format: new MVT(),
            maxZoom: 1,
        }),

        style: (feature) => {
            const iso_a2 = feature.get('iso_a2');
            const isSelected = iso_a2 === this.selectedCountry;
            const countryInfo = CountryData.get(iso_a2);
            const isIbfSupported = countryInfo?.ibfSupported ?? false;

            let fillColor: string;
            let strokeColor: string;

            if (isIbfSupported) {
                fillColor = isSelected ? "#d63384" : "#f8bbd9";
            } else {
                fillColor = isSelected ? "#b3b3b3" : "#e0e0e0";
            }
            strokeColor = "#a4a4a4";

            return new Style({
                fill: new Fill({
                    color: fillColor,
                }),
                stroke: new Stroke({
                    color: strokeColor,
                    width: 1,
                }),
            });
        },
    });

    vAdmin1 = new VectorTileLayer({
        source: new VectorTile({
            url: countryVectors2,
            format: new MVT(),
            maxZoom: 2,
        }),
        visible: false,
        style: (feature) => {
            const iso_a2 = feature.get('iso_a2');
            const isSelected = iso_a2 === this.selectedCountry;
            return new Style({
                fill: new Fill({
                    color: isSelected ? "rgb(251, 186, 89)" : "rgb(243, 255, 17)",
                }),
                stroke: new Stroke({
                    color: isSelected ? "rgb(0, 255, 38)" : "rgb(131, 225, 156)",
                    width: 2,
                }),
            });
        },
    });


    ngAfterViewInit(): void {
        this.initMap();
    }

    private initMap(): void {


        const attribution = new Attribution({
            collapsible: false,
        });


        this.map = new Map({
            target: 'map',
            controls: defaultControls({ attribution: false }).extend([attribution]),

            layers: [
                this.vAdmin0,
                this.vAdmin1,
            ],
            view: new View({
                constrainResolution: true,
                center: fromLonLat([0, 0]),
                zoom: 1,
                maxZoom: 6
            })
        });


        // Change cursor on hover
        this.map.on('pointermove', (evt) => {
            const pixel = this.map.getEventPixel(evt.originalEvent);
            const hit = this.map.hasFeatureAtPixel(pixel);
            this.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
        });

        // Click handler to toggle between admin0 and admin1 layers
        this.map.on('click', (evt) => {
            this.map.forEachFeatureAtPixel(evt.pixel, (feature) => {
                const properties = feature.getProperties();
                console.log('Clicked on location:', properties);
                console.log('Name:', properties['name'] || properties['NAME'] || 'Unknown');
                this.selectedCountry = properties['iso_a2'] || 'Unknown';
                console.log('Selected iso_a2:', this.selectedCountry);

                // Print country metadata from CountryData
                const countryInfo = CountryData.get(this.selectedCountry);
                if (countryInfo) {
                    console.log('Country Metadata:', {
                        code: this.selectedCountry,
                        iso_a3: countryInfo.iso_a3,
                        name: countryInfo.name,
                        ibfSupported: countryInfo.ibfSupported,
                        initialZoom: countryInfo.initialZoom,
                        latlong: countryInfo.latlong
                    });

                    // Focus the map on the country center
                    const [lat, lon] = countryInfo.latlong;
                    this.map.getView().animate({
                        center: fromLonLat([lon, lat]),
                        zoom: countryInfo.initialZoom,
                        duration: 500
                    });
                } else {
                    console.log('No metadata found for country:', this.selectedCountry);
                }

                // Refresh both layers to update styles
                this.vAdmin0.changed();
                this.vAdmin1.changed();

                // Toggle between admin0 and admin1 layers
                const admin0Visible = this.vAdmin0.getVisible();
                this.vAdmin0.setVisible(!admin0Visible);
                this.vAdmin1.setVisible(admin0Visible);

                return true;
            });
        });
    }



}

