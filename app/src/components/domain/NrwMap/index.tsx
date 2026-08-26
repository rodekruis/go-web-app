import { useEffect } from 'react';

import useNrwEvents from '#views/CountryProfileNationalRiskWatch/hooks/useNrwEvents';
import {
    type CountryCodeIso3,
    type InitialMapView,
    type MapViewChangeHandler,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwMapContainer from './NrwMapContainer';

// This component knows nothing about Mapbox.

function NrwMap(props: {
    initialMapView: InitialMapView;
    onMapViewChange: MapViewChangeHandler;
    countries: CountryCodeIso3[];
}) {
    const {
        initialMapView,
        onMapViewChange,
        countries,
    } = props;

    const {
        events,
        pending,
        error,
    } = useNrwEvents(countries);

    useEffect(
        () => {
            if (pending) {
                return;
            }

            // eslint-disable-next-line no-console
            console.info('NRW events loaded', { events, error });
        },
        [pending, events, error],
    );

    return (
        <NrwMapContainer
            initialMapView={initialMapView}
            onMapViewChange={onMapViewChange}
        />
    );
}

export default NrwMap;
