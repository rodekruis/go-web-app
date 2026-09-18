import { useContext } from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import NrwEventsContext from '#views/CountryProfileNationalRiskWatch/NrwEventsContext';
import NrwLayersContext from '#views/CountryProfileNationalRiskWatch/NrwLayersContext';
import NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type Latitude,
    type Longitude,
    type MapView,
    type MapViewChangeHandler,
} from '#views/CountryProfileNationalRiskWatch/types';
import { parseCountryCode } from '#views/CountryProfileNationalRiskWatch/utils';

import NrwEventMarker from './NrwEventMarker';
import NrwLayer from './NrwLayer';
import NrwLayerPanel from './NrwLayerPanel';
import NrwMapContainer from './NrwMapContainer';
import NrwMarker from './NrwMarker';

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
}) {
    const { mapView, onMapViewChange } = props;

    const {
        events,
        selectedEvent,
        hoveredEventId,
        onEventHoverChange,
        onEventSelect,
    } = useContext(NrwEventsContext);

    const {
        availableLayers,
        visibleLayers,
        onLayerToggle,
    } = useContext(NrwLayersContext);

    const eventCountryCodeIso3 = parseCountryCode(selectedEvent?.countryCodeIso3);

    const layerPanel = isDefined(eventCountryCodeIso3) ? (
        <NrwLayerPanel
            layers={availableLayers}
            visibleLayers={visibleLayers}
            onLayerToggle={onLayerToggle}
        />
    ) : undefined;

    return (
        <NrwMapContainer
            mapView={mapView}
            onMapViewChange={onMapViewChange}
            layerPanel={layerPanel}
        >
            {isDefined(eventCountryCodeIso3) && availableLayers?.map((layer) => (
                <NrwLayer
                    key={layer.name}
                    countryCodeIso3={eventCountryCodeIso3}
                    layer={layer}
                    isVisible={visibleLayers.includes(layer.name)}
                />
            ))}
            {isNotDefined(selectedEvent) && events?.map((event) => {
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
                            event={event}
                            hovered={event.eventId === hoveredEventId}
                            onHoverChange={onEventHoverChange}
                            onSelect={onEventSelect}
                        />
                    </NrwMarker>
                );
            })}
        </NrwMapContainer>
    );
}

export default NrwMap;
