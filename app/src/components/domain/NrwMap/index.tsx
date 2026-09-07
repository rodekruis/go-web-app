import { useMemo } from 'react';
import { isDefined } from '@togglecorp/fujs';

import useNrwLayers from '#views/CountryProfileNationalRiskWatch/hooks/useNrwLayers';
import NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type CountryCodeIso3,
    type Latitude,
    type Longitude,
    type MapView,
    type MapViewChangeHandler,
    type NrwEvent,
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
    mapView: MapView;
    onMapViewChange: MapViewChangeHandler;
    events: NrwEvent[] | undefined;
    countries: CountryCodeIso3[];
}) {
    const {
        mapView,
        onMapViewChange,
        events,
        countries,
    } = props;

    // Logs the available NRW layers to the console.
    // This is replaced in the next PR.
    const countriesResolved = countries.length > 0;
    useNrwLayers(countriesResolved);

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
            mapView={mapView}
            onMapViewChange={onMapViewChange}
            markers={markers}
        />
    );
}

export default NrwMap;
