import { useEffect } from 'react';

import useNrwEvents from '#views/CountryProfileNationalRiskWatch/hooks/useNrwEvents';
import {
    type InitialMapView,
    type MapViewChangeHandler,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwMapContainer from './NrwMapContainer';

const DEFAULT_COUNTRY_CODE_ISO3 = 'MWI';

// This component knows nothing about Mapbox.

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

    const {
        response: events,
        pending,
        error,
    } = useNrwEvents({ countryCodeIso3 });

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
