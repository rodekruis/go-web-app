import {
    type InitialMapView,
    type MapViewChangeHandler,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwMapContainer from './NrwMapContainer';

// This component knows nothing about Mapbox.

function NrwMap(props: {
    initialMapView: InitialMapView;
    onMapViewChange: MapViewChangeHandler;
}) {
    const {
        initialMapView,
        onMapViewChange,
    } = props;

    return (
        <NrwMapContainer
            initialMapView={initialMapView}
            onMapViewChange={onMapViewChange}
        />
    );
}

export default NrwMap;
