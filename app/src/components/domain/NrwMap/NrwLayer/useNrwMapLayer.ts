import {
    useContext,
    useEffect,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';
import { type Map as MapboxMap } from 'mapbox-gl-v3';

import NrwMapContext from '../NrwMapContext';

function useNrwMapLayer(
    mapLayer: Parameters<MapboxMap['addLayer']>[0] | undefined,
    isVisible: boolean,
) {
    const { map } = useContext(NrwMapContext);

    // mount & unmount
    useEffect(
        () => {
            if (isNotDefined(map) || isNotDefined(mapLayer)) {
                return undefined;
            }

            map.addLayer(mapLayer);

            return () => {
                const { id } = mapLayer;

                if (map.getLayer(id)) map.removeLayer(id);
                if (map.getSource(id)) map.removeSource(id);
            };
        },
        [map, mapLayer],
    );

    // control visibility
    useEffect(
        () => {
            if (isNotDefined(map) || isNotDefined(mapLayer) || !map.getLayer(mapLayer.id)) {
                return;
            }

            map.setLayoutProperty(mapLayer.id, 'visibility', isVisible ? 'visible' : 'none');
        },
        [map, mapLayer, isVisible],
    );
}

export default useNrwMapLayer;
