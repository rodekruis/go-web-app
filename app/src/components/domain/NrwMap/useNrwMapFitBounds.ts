import {
    useContext,
    useEffect,
    useRef,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';

import { type LongitudeLatitudeBounds } from '#views/CountryProfileNationalRiskWatch/types';

import NrwMapContext from './NrwMapContext';

const paddingPixels = 20;

// Fit the map to the given bounds whenever they change.
// While the initial view is preserved, the first bounds leave the map where it is.
function useNrwMapFitBounds(bounds: LongitudeLatitudeBounds | undefined) {
    const { map, preserveInitialView } = useContext(NrwMapContext);
    const hasFitRef = useRef(false);

    useEffect(
        () => {
            if (isNotDefined(map) || isNotDefined(bounds)) {
                return;
            }

            const isFirstFit = !hasFitRef.current;
            hasFitRef.current = true;
            if (isFirstFit && preserveInitialView) {
                return;
            }

            map.fitBounds(bounds, { padding: paddingPixels });
        },
        [map, bounds, preserveInitialView],
    );
}

export default useNrwMapFitBounds;
