import {
    useCallback,
    useMemo,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import { useNrwRequest } from '#utils/restRequest';

import { type NrwLayersContextProps } from '../contexts/NrwLayersContext';
import {
    type NrwHazardType,
    type NrwLayerName,
    type VisibleLayersChangeHandler,
} from '../types';

const defaultVisibleLayers: NrwLayerName[] = [];

function useNrwLayers(props: {
    urlLayers: NrwLayerName[] | undefined;
    onVisibleLayersChange: VisibleLayersChangeHandler;
    hazardType?: NrwHazardType;
}): NrwLayersContextProps {
    const {
        urlLayers,
        onVisibleLayersChange,
        hazardType,
    } = props;

    const { response: availableLayers } = useNrwRequest({
        url: '/layers',
        apiType: 'nrw',
        query: isDefined(hazardType) ? { hazardType } : undefined,
    });

    // Layers preference: URL > default.
    const visibleLayers = urlLayers ?? defaultVisibleLayers;

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

    return useMemo(
        () => ({
            availableLayers,
            visibleLayers,
            onLayerToggle: handleLayerToggle,
        }),
        [availableLayers, visibleLayers, handleLayerToggle],
    );
}

export default useNrwLayers;
