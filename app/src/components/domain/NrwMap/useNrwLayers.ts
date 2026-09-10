import { isDefined } from '@togglecorp/fujs';

import { useNrwRequest } from '#utils/restRequest';
import { type NrwHazardType } from '#views/CountryProfileNationalRiskWatch/types';

function useNrwLayers(hazardType?: NrwHazardType) {
    const { response, error } = useNrwRequest({
        url: '/layers',
        apiType: 'nrw',
        query: isDefined(hazardType) ? { hazardType } : undefined,
    });

    return { availableLayers: response, error };
}

export default useNrwLayers;
