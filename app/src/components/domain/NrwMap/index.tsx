import {
    useEffect,
    useMemo,
} from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import useNrwEvents from '#views/CountryProfileNationalRiskWatch/hooks/useNrwEvents';
import useNrwLayers from '#views/CountryProfileNationalRiskWatch/hooks/useNrwLayers';
import NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type CountryCodeIso3,
    type InitialMapView,
    type Latitude,
    type Longitude,
    type MapViewChangeHandler,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwEventMarker from './NrwEventMarker';
import NrwMapContainer, { type NrwMapMarker } from './NrwMapContainer';

// This component knows nothing about Mapbox.

// The generated API type for centroid is Record<string, never>, while the
// backend actually returns { latitude, longitude }.
interface EventCentroid {
    latitude: number;
    longitude: number;
}

function parseCentroid(centroid: unknown): NrwLngLat | undefined {
    if (
        typeof centroid !== 'object'
        || centroid === null
        || typeof (centroid as EventCentroid).latitude !== 'number'
        || typeof (centroid as EventCentroid).longitude !== 'number'
    ) {
        return undefined;
    }

    const { latitude, longitude } = centroid as EventCentroid;
    return new NrwLngLat(longitude as Longitude, latitude as Latitude);
}

function NrwMap(props: {
    initialMapView: InitialMapView;
    onMapViewChange: MapViewChangeHandler;
    countries: CountryCodeIso3[];
    countriesResolved: boolean;
}) {
    const {
        initialMapView,
        onMapViewChange,
        countries,
        countriesResolved,
    } = props;

    const {
        events,
    } = useNrwEvents(countries);

    const {
        availableLayers,
        rasterLayerDetails,
        loadLayer,
    } = useNrwLayers();

    useEffect(
        () => {
            if (!countriesResolved || isNotDefined(availableLayers)) {
                return;
            }

            const populationAvailable = availableLayers.some(
                ({ name, type }) => name === 'population' && type === 'raster',
            );

            if (!populationAvailable) {
                return;
            }

            countries.forEach((countryCodeIso3) => loadLayer(countryCodeIso3, 'population'));
        },

        [availableLayers, countries, countriesResolved, loadLayer],
    );

    const markers = useMemo<NrwMapMarker[] | undefined>(
        () => events?.map((event) => {
            const coordinates = parseCentroid(event.centroid);
            if (!coordinates) {
                return undefined;
            }

            return {
                id: String(event.eventId),
                coordinates,
                content: (
                    <NrwEventMarker
                        alertClass={event.alertClass}
                        hazardType={event.hazardType}
                        trigger={event.trigger}
                    />
                ),
            };
        }).filter(isDefined),
        [events],
    );

    return (
        <NrwMapContainer
            initialMapView={initialMapView}
            onMapViewChange={onMapViewChange}
            markers={markers}
            rasterLayerDetails={rasterLayerDetails}
        />
    );
}

export default NrwMap;
