import {
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';
import mapboxgl, { type Marker as MapboxMarker } from 'mapbox-gl-v3';

import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';

import NrwMapContext from '../NrwMapContext';

function useNrwMapMarker(coordinates: NrwLngLat): HTMLDivElement {
    const { map } = useContext(NrwMapContext);

    const { lng, lat } = coordinates;

    const [element] = useState(() => document.createElement('div'));
    const markerRef = useRef<MapboxMarker | undefined>(undefined);

    useEffect(() => {
        if (isNotDefined(map)) {
            return undefined;
        }

        const marker = new mapboxgl.Marker({ element, anchor: 'bottom' })
            .setLngLat([lng, lat])
            .addTo(map);

        markerRef.current = marker;

        return () => {
            markerRef.current = undefined;
            marker.remove();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, element]);

    useEffect(() => {
        markerRef.current?.setLngLat([lng, lat]);
    }, [lng, lat]);

    return element;
}

export default useNrwMapMarker;
