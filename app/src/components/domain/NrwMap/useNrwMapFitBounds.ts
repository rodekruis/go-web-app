import {
    useContext,
    useEffect,
    useRef,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';

import { type LongitudeLatitudeBounds } from '#views/CountryProfileNationalRiskWatch/types';

import NrwMapContext from './NrwMapContext';

const defaultPaddingPixels = 20;

// Fit the map to the given bounds whenever they change
// unless there is an overriding initial view (from the deeplink)
function useNrwMapFitBounds(bounds: LongitudeLatitudeBounds | undefined) {
    const { map, preserveInitialView } = useContext(NrwMapContext);
    const isFirstCall = useRef(true);

    useEffect(
        () => {
            if (isNotDefined(map) || isNotDefined(bounds)) {
                return;
            }

            // Only check for the deeplink override on first call of this effect
            if (isFirstCall.current) {
                isFirstCall.current = false;
                if (preserveInitialView) {
                    return;
                }
            }

            map.fitBounds(bounds, { padding: defaultPaddingPixels });
        },
        [map, bounds, preserveInitialView],
    );
}

export default useNrwMapFitBounds;
