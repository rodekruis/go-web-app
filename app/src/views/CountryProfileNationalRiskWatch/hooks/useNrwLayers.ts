import { useCallback } from 'react';
import { isDefined } from '@togglecorp/fujs';

import { useNrwRequest } from '#utils/restRequest';

import {
    type NrwHazardType,
    type NrwLayerName,
    type VisibleLayersChangeHandler,
} from '../types';

function useNrwLayers(props: {
    visibleLayers: NrwLayerName[];
    onVisibleLayersChange: VisibleLayersChangeHandler;
    hazardType?: NrwHazardType;
}) {
    const {
        visibleLayers,
        onVisibleLayersChange,
        hazardType,
    } = props;

    const { response: availableLayers } = useNrwRequest({
        url: '/layers',
        apiType: 'nrw',
        query: isDefined(hazardType) ? { hazardType } : undefined,
    });

    const handleLayerToggle = useCallback(
        (name: NrwLayerName) => {
            onVisibleLayersChange(
                visibleLayers.includes(name)
                    ? visibleLayers.filter((visibleName) => visibleName !== name)
                    : [...visibleLayers, name],
            );
        },
        [visibleLayers, onVisibleLayersChange],
    );

    return {
        availableLayers,
        visibleLayers,
        handleLayerToggle,
    };
}

export default useNrwLayers;
