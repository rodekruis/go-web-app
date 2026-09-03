import { createPortal } from 'react-dom';
import { type Map as MapboxMap } from 'mapbox-gl-v3';

import useNrwMapMarker from '#hooks/domain/useNrwMapMarker';
import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';

function NrwMapMarkerPortal(props: {
    mapboxMap: MapboxMap | undefined;
    coordinates: NrwLngLat;
    children: React.ReactNode;
}) {
    const {
        mapboxMap,
        coordinates: { lng, lat },
        children,
    } = props;

    const element = useNrwMapMarker(mapboxMap, lng, lat);

    return createPortal(children, element);
}

export default NrwMapMarkerPortal;
