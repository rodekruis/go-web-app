import { useState } from 'react';
import { isDefined } from '@togglecorp/fujs';

import { nrwLayerNames } from '#utils/nrw/layers';
import { useNrwRequest } from '#utils/restRequest';
import {
    type NrwHazardType,
    type NrwLayerName,
} from '#views/CountryProfileNationalRiskWatch/types';

function useNrwLayers(hazardType?: NrwHazardType) {
    const { response, error } = useNrwRequest({
        url: '/layers',
        apiType: 'nrw',
        query: isDefined(hazardType) ? { hazardType } : undefined,
    });

    // Layers shown by default
    const [visibleLayers, setVisibleLayers] = useState<NrwLayerName[]>([
        nrwLayerNames.populationDensity,
    ]);

    const handleLayerToggle = (name: NrwLayerName) => {
        setVisibleLayers((prev) => (
            prev.includes(name)
                ? prev.filter((visibleName) => visibleName !== name)
                : [...prev, name]
        ));
    };

    return {
        availableLayers: response,
        error,
        visibleLayers,
        handleLayerToggle,
    };
}

export default useNrwLayers;
