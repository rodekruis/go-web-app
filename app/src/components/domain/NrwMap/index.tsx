import { useEffect } from 'react';

import useNrwEvents from '#views/CountryProfileNationalRiskWatch/hooks/useNrwEvents';
import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type MapViewChangeHandler,
    type Zoom,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwMapContainer from './NrwMapContainer';

const DEFAULT_COUNTRY_CODE_ISO3 = 'MWI';

// This component knows nothing about Mapbox.

function NrwMap(props: {
    zoom: Zoom;
    center: NrwLngLat;
    onMapViewChange: MapViewChangeHandler;
    countryCodeIso3?: string;
}) {
    const {
        zoom,
        center,
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
            zoom={zoom}
            center={center}
            onMapViewChange={onMapViewChange}
        />
    );
}

export default NrwMap;
