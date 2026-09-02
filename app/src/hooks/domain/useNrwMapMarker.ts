import {
    useEffect,
    useRef,
    useState,
} from 'react';
import mapboxgl, {
    type Map as MapboxMap,
    type Marker as MapboxMarker,
} from 'mapbox-gl-v3';

import {
    type Latitude,
    type Longitude,
} from '#views/CountryProfileNationalRiskWatch/types';

export default function useNrwMapMarker(
    mapboxMap: MapboxMap | undefined,
    longitude: Longitude,
    latitude: Latitude,
): HTMLDivElement {
    const [element] = useState(() => document.createElement('div'));
    const markerRef = useRef<MapboxMarker | undefined>(undefined);

    useEffect(() => {
        if (!mapboxMap) {
            return undefined;
        }

        const marker = new mapboxgl.Marker({ element, anchor: 'bottom' })
            .setLngLat([longitude, latitude])
            .addTo(mapboxMap);

        markerRef.current = marker;

        return () => {
            markerRef.current = undefined;
            marker.remove();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapboxMap, element]);

    useEffect(() => {
        markerRef.current?.setLngLat([longitude, latitude]);
    }, [longitude, latitude]);

    return element;
}
