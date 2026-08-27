import { useMemo } from 'react';

import useNrwEvents from '#views/CountryProfileNationalRiskWatch/hooks/useNrwEvents';
import NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type InitialMapView,
    type Latitude,
    type Longitude,
    type MapViewChangeHandler,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwMapContainer from './NrwMapContainer';
import NrwMapMarker from './NrwMapMarker';

const DEFAULT_COUNTRY_CODE_ISO3 = 'UGA';

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
    countryCodeIso3?: string;
}) {
    const {
        initialMapView,
        onMapViewChange,
        countryCodeIso3 = DEFAULT_COUNTRY_CODE_ISO3,
    } = props;

    const { response: events } = useNrwEvents({ countryCodeIso3 });

    const markers = useMemo(
        () => events?.map((event) => {
            const coordinates = parseCentroid(event.centroid);
            if (!coordinates) {
                return null;
            }

            return (
                <NrwMapMarker
                    key={event.eventId}
                    id={String(event.eventId)}
                    coordinates={coordinates}
                    alertClass={event.alertClass}
                    hazardType={event.hazardType}
                    trigger={event.trigger}
                />
            );
        }),
        [events],
    );

    return (
        <NrwMapContainer
            initialMapView={initialMapView}
            onMapViewChange={onMapViewChange}
            markers={markers}
        />
    );
}

export default NrwMap;
