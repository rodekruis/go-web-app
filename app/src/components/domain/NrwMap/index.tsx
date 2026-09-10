import {
    useMemo,
    useState,
} from 'react';
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
    type NrwLayer as NrwLayerType,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwEventMarker from './NrwEventMarker';
import NrwLayer from './NrwLayer';
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
        mapView, onMapViewChange, events, countries,
    } = props;

    const { availableLayers } = useNrwLayers();

    // HACK: layers must be shown per country, use workaround for now
    const countryCodeIso3 = countries[0];

    const [visibleLayers] = useState<NrwLayerType['name'][]>([]);

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
        >
            {isDefined(countryCodeIso3) && availableLayers?.map((layer) => (
                <NrwLayer
                    key={layer.name}
                    countryCodeIso3={countryCodeIso3}
                    layer={layer}
                    isVisible={visibleLayers.includes(layer.name)}
                />
            ))}
        </NrwMapContainer>
    );
}

export default NrwMap;
