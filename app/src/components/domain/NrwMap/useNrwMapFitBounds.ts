import {
    useContext,
    useEffect,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';

import { type LongitudeLatitudeBounds } from '#views/CountryProfileNationalRiskWatch/types';

import NrwMapContext from './NrwMapContext';

const defaultPaddingPixels = 20;

// Fit the map to the given bounds whenever they change.
function useNrwMapFitBounds(
    bounds: LongitudeLatitudeBounds | undefined,
    paddingPixels = defaultPaddingPixels,
) {
    const { map } = useContext(NrwMapContext);

    useEffect(
        () => {
            if (isNotDefined(map) || isNotDefined(bounds)) {
                return;
            }

            map.fitBounds(bounds, { padding: paddingPixels });
        },
        [map, bounds, paddingPixels],
    );
}

export default useNrwMapFitBounds;
