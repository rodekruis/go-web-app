import {
    useEffect,
    useMemo,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import {
    type NrwApiResponse,
    useNrwRequest,
} from '#utils/restRequest';

// Derived types from the API response
export type NrwLayer = NrwApiResponse<'/layers'>[number];
type NrwHazardType = NonNullable<NrwLayer['hazardType']>;

// Pass in the hazard type to get layers specific to that hazard type, or
// pass in nothing/undefined to get all non-event layers
function useNrwLayers(countriesResolved : boolean, hazardType?: NrwHazardType) {
    const skip = !countriesResolved;
    const {
        response,
        pending,
        error,
    } = useNrwRequest({
        url: '/layers',
        apiType: 'nrw',
        skip,
        ...(isDefined(hazardType) && {
            query: { hazardType },
        }),
    });

    const layers = useMemo(() => response, [response]);

    useEffect(
        () => {
            if (isDefined(layers)) {
                // eslint-disable-next-line no-console
                console.log('Available NRW layers', layers);
            }
        },
        [layers],
    );

    return {
        layers,
        pending,
        error,
    };
}

export default useNrwLayers;
