import { createPortal } from 'react-dom';

import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';

import useNrwMapMarker, { type NrwMarkerPlacement } from './useNrwMapMarker';

function NrwMarker(props: {
    coordinates: NrwLngLat;
    placement?: NrwMarkerPlacement;
    children: React.ReactNode;
}) {
    const { coordinates, placement, children } = props;

    const element = useNrwMapMarker(coordinates, placement);

    return createPortal(children, element);
}

export default NrwMarker;
