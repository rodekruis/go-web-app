import { useState } from 'react';
import { isDefined } from '@togglecorp/fujs';

import { useNrwRequest } from '#utils/restRequest';
import {
    type NrwHazardType,
    type NrwLayer,
} from '#views/CountryProfileNationalRiskWatch/types';

function useNrwLayers(hazardType?: NrwHazardType) {
    const { response, error } = useNrwRequest({
        url: '/layers',
        apiType: 'nrw',
        query: isDefined(hazardType) ? { hazardType } : undefined,
    });

    // Layers shown by default
    const [visibleLayers, setVisibleLayers] = useState<NrwLayer['name'][]>(['population']);

    const handleLayerToggle = (name: NrwLayer['name']) => {
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
