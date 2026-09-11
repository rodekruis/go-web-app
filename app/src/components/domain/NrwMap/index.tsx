import {
    useCallback,
    useState,
} from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type Latitude,
    type Longitude,
    type MapView,
    type MapViewChangeHandler,
    type NrwEvent,
    type NrwLayer as NrwLayerType,
} from '#views/CountryProfileNationalRiskWatch/types';
import { parseCountryCode } from '#views/CountryProfileNationalRiskWatch/utils';

import NrwEventMarker from './NrwEventMarker';
import NrwLayer from './NrwLayer';
import NrwLayerPanel from './NrwLayerPanel';
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
    selectedEvent: NrwEvent | undefined;
    hoveredEventId: NrwEvent['eventId'] | undefined;
    onEventHoverChange: (eventId: NrwEvent['eventId'] | undefined) => void;
    onEventSelect: (eventId: NrwEvent['eventId'] | undefined) => void;
}) {
    const {
        mapView,
        onMapViewChange,
        events,
        selectedEvent,
        hoveredEventId,
        onEventHoverChange,
        onEventSelect,
    } = props;

    const { availableLayers } = useNrwLayers();

    const eventCountryCodeIso3 = parseCountryCode(selectedEvent?.countryCodeIso3);

    const defaultVisibleLayerNames: ReadonlySet<NrwLayerType['name']> = new Set(['population']);
    const [layerOverrides, setLayerOverrides] = useState<
        Partial<Record<NrwLayerType['name'], boolean>>
    >({});

    const isLayerVisible = useCallback(
        (name: NrwLayerType['name']) => (
            layerOverrides[name] ?? defaultVisibleLayerNames.has(name)
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [layerOverrides],
    );

    const handleToggleLayer = useCallback(
        (name: NrwLayerType['name']) => {
            setLayerOverrides((prev) => ({
                ...prev,
                [name]: !(prev[name] ?? defaultVisibleLayerNames.has(name)),
            }));
        },
        [],
    );

    return (
        <NrwMapContainer
            mapView={mapView}
            onMapViewChange={onMapViewChange}
            layerPanel={(
                <NrwLayerPanel
                    layers={availableLayers}
                    isLayerVisible={isLayerVisible}
                    onToggleLayer={handleToggleLayer}
                />
            )}
        >
            {isDefined(eventCountryCodeIso3) && availableLayers?.map((layer) => (
                <NrwLayer
                    key={layer.name}
                    countryCodeIso3={eventCountryCodeIso3}
                    layer={layer}
                    isVisible={isLayerVisible(layer.name)}
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
