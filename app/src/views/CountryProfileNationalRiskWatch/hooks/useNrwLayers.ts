import { useCallback } from 'react';
import { isDefined } from '@togglecorp/fujs';

import supportedLayerNames from '#utils/nrw/layers';
import { useNrwRequest } from '#utils/restRequest';

import {
    type NrwHazardType,
    type NrwLayerName,
    type VisibleLayersChangeHandler,
} from '../types';

const defaultVisibleLayers: NrwLayerName[] = [supportedLayerNames.exposedPopulation];

function useNrwLayers(props: {
    urlLayers: NrwLayerName[] | undefined;
    onVisibleLayersChange: VisibleLayersChangeHandler;
    hazardType?: NrwHazardType;
}) {
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

    return {
        availableLayers,
        visibleLayers,
        handleLayerToggle,
    };
}

export default useNrwLayers;
