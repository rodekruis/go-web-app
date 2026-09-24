import {
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import { type MapMouseEvent } from 'mapbox-gl-v3';

import NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type AdminAreaProperties,
    type Latitude,
    type Longitude,
} from '#views/CountryProfileNationalRiskWatch/types';
import { parseAdminAreaProperties } from '#views/CountryProfileNationalRiskWatch/utils';

import NrwMapContext from '../../NrwMapContext';

interface HoveredAdminArea extends AdminAreaProperties {
    coordinates: NrwLngLat;
}

// Highlight the admin area under the pointer through its hover feature state
// and return it with the pointer position for a tooltip.
function useAdminAreaHover(layerId: string, isEnabled: boolean) {
    const { map } = useContext(NrwMapContext);
    const [hoveredAdminArea, setHoveredAdminArea] = useState<HoveredAdminArea>();

    const clearHover = useCallback(
        () => {
            if (isNotDefined(map)) {
                return;
            }

            map.getCanvas().style.cursor = '';
            if (isDefined(map.getSource(layerId))) {
                map.removeFeatureState({ source: layerId });
            }
            setHoveredAdminArea(undefined);
        },
        [map, layerId],
    );

    useEffect(
        () => {
            if (isNotDefined(map) || !isEnabled) {
                return undefined;
            }

            const handleMouseMove = (event: MapMouseEvent) => {
                const feature = event.features?.[0];
                const properties = parseAdminAreaProperties(feature?.properties);

                if (isNotDefined(feature?.id) || properties === null) {
                    return;
                }

                map.getCanvas().style.cursor = 'pointer';
                map.removeFeatureState({ source: layerId });
                map.setFeatureState({ source: layerId, id: feature.id }, { hover: true });
                setHoveredAdminArea({
                    ...properties,
                    coordinates: new NrwLngLat(
                        event.lngLat.lng as Longitude,
                        event.lngLat.lat as Latitude,
                    ),
                });
            };

            map.on('mousemove', layerId, handleMouseMove);
            map.on('mouseleave', layerId, clearHover);

            return () => {
                map.off('mousemove', layerId, handleMouseMove);
                map.off('mouseleave', layerId, clearHover);
                clearHover();
            };
        },
        [map, layerId, isEnabled, clearHover],
    );

    return { hoveredAdminArea, clearHover };
}

export default useAdminAreaHover;
