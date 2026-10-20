import {
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    _cs,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import mapboxgl, {
    type Marker as MapboxMarker,
    type MarkerOptions,
} from 'mapbox-gl-v3';

import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';

import NrwMapContext from '../NrwMapContext';

import styles from './styles.module.css';

export type NrwMarkerPlacement = Pick<MarkerOptions, 'anchor' | 'offset'>;

function useNrwMapMarker(
    coordinates: NrwLngLat,
    placement: NrwMarkerPlacement = { anchor: 'center' },
): HTMLDivElement {
    const { map } = useContext(NrwMapContext);

    const { lng, lat } = coordinates;

    const [element] = useState(() => {
        const markerElement = document.createElement('div');
        markerElement.className = _cs(styles.marker);
        return markerElement;
    });
    const markerRef = useRef<MapboxMarker | undefined>(undefined);

    // Placement can be new every render, use numeric values to avoid
    // unnecessary marker recreation.
    const { anchor, offset: placementOffset } = placement;
    const offsetX = placementOffset?.[0];
    const offsetY = placementOffset?.[1];

    useEffect(() => {
        if (isNotDefined(map)) {
            return undefined;
        }

        const offset: mapboxgl.PointLike | undefined = isDefined(offsetX) && isDefined(offsetY)
            ? [offsetX, offsetY]
            : undefined;

        const marker = new mapboxgl.Marker({ element, anchor, offset })
            .setLngLat([lng, lat])
            .addTo(map);

        markerRef.current = marker;

        return () => {
            markerRef.current = undefined;
            marker.remove();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, element, anchor, offsetX, offsetY]);

    useEffect(() => {
        markerRef.current?.setLngLat([lng, lat]);
    }, [lng, lat]);

    return element;
}

export default useNrwMapMarker;
