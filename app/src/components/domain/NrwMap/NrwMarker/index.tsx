import { createPortal } from 'react-dom';

import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';

import useNrwMapMarker from './useNrwMapMarker';

function NrwMarker(props: {
    coordinates: NrwLngLat;
    children: React.ReactNode;
}) {
    const { coordinates, children } = props;

    const element = useNrwMapMarker(coordinates);

    return createPortal(children, element);
}

export default NrwMarker;
