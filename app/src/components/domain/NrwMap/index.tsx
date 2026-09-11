import { useState } from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type CountryCodeIso3,
    type Latitude,
    type Longitude,
    type MapView,
    type MapViewChangeHandler,
    type NrwEvent,
    type NrwLayer as NrwLayerType,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwEventMarker from './NrwEventMarker';
import NrwLayer from './NrwLayer';
import NrwMapContainer from './NrwMapContainer';
import NrwMarker from './NrwMarker';
import useNrwLayers from './useNrwLayers';

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
        mapView, onMapViewChange, events, countries,
    } = props;

    const { availableLayers } = useNrwLayers();

    // The map only supports single countries for the layers.
    // If multiple countries, select the first only.
    // This will be refactored out once event selection is in.
    const countryCodeIso3 = countries[0];

    // Layers shown by default
    const [visibleLayers] = useState<NrwLayerType['name'][]>(['population']);

    return (
        <NrwMapContainer
            mapView={mapView}
            onMapViewChange={onMapViewChange}
        >
            {isDefined(countryCodeIso3) && availableLayers?.map((layer) => (
                <NrwLayer
                    key={layer.name}
                    countryCodeIso3={countryCodeIso3}
                    layer={layer}
                    isVisible={visibleLayers.includes(layer.name)}
                />
            ))}
            {events?.map((event) => {
                const coordinates = parseCentroid(event.centroid);

                if (isNotDefined(coordinates)) {
                    return null;
                }

                return (
                    <NrwMarker
                        key={event.eventId}
                        coordinates={coordinates}
                    >
                        <NrwEventMarker
                            alertClass={event.alertClass}
                            hazardType={event.hazardType}
                            trigger={event.trigger}
                        />
                    </NrwMarker>
                );
            })}
        </NrwMapContainer>
    );
}

export default NrwMap;
