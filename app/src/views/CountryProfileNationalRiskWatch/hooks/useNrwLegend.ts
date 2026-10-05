import { useMemo } from 'react';

import { getNrwLegendItems } from '#utils/nrw/legend';

import {
    type NrwLayer,
    type NrwLayerName,
} from '../types';

// Legend content management for both the map panel and the footer
function useNrwLegend(props: {
    availableLayers: NrwLayer[] | undefined;
    visibleLayers: NrwLayerName[];
    enabled: boolean;
}) {
    const { availableLayers, visibleLayers, enabled } = props;

    const legendItems = useMemo(
        () => (enabled
            ? getNrwLegendItems(availableLayers, visibleLayers)
            : []),
        [availableLayers, visibleLayers, enabled],
    );

    return { legendItems };
}

export default useNrwLegend;
