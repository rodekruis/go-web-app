import {
    useCallback,
    useMemo,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import { useNrwRequest } from '#utils/restRequest';

import {
    type NrwEvent,
    type NrwHazardType,
    type NrwLayer,
    type NrwLayerName,
    type VisibleLayersChangeHandler,
} from '../types';

function useNrwLayers(props: {
    visibleLayers: NrwLayerName[];
    onVisibleLayersChange: VisibleLayersChangeHandler;
    hazardType?: NrwHazardType;
    selectedEvent?: Pick<NrwEvent, 'availableLayers'>;
}) {
    const {
        visibleLayers,
        onVisibleLayersChange,
        hazardType,
        selectedEvent,
    } = props;

    const { response: staticLayers } = useNrwRequest({
        url: '/layers',
        apiType: 'nrw',
        query: isDefined(hazardType) ? { hazardType } : undefined,
    });

    const availableLayers = useMemo<NrwLayer[] | undefined>(() => {
        if (!selectedEvent?.availableLayers.length) {
            return staticLayers;
        }

        return [...(staticLayers ?? []), ...selectedEvent.availableLayers];
    }, [staticLayers, selectedEvent]);

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
