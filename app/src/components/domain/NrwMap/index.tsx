import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type MapViewChangeHandler,
    type Zoom,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwMapContainer from './NrwMapContainer';

// This component knows nothing about Mapbox.

function NrwMap(props: {
    zoom: Zoom;
    center: NrwLngLat;
    onMapViewChange: MapViewChangeHandler;
}) {
    const {
        zoom,
        center,
        onMapViewChange,
    } = props;

    return (
        <NrwMapContainer
            zoom={zoom}
            center={center}
            onMapViewChange={onMapViewChange}
        />
    );
}

export default NrwMap;
