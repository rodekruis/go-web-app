import {
    useContext,
    useEffect,
    useRef,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';

import { type LongitudeLatitudeBounds } from '#views/CountryProfileNationalRiskWatch/types';

import NrwMapContext from './NrwMapContext';

const defaultPaddingPixels = 20;

// Fit the map to the given bounds whenever they change,
// unless the map view is preserved (a link, or the browser back and forward buttons).
function useNrwMapFitBounds(bounds: LongitudeLatitudeBounds | undefined) {
    const { map, preserveMapView } = useContext(NrwMapContext);

    // Read from a ref, so that the map view no longer being preserved does not fit by itself:
    // that happens when the user pans the map, too.
    const preserveMapViewRef = useRef(preserveMapView);
    useEffect(
        () => {
            preserveMapViewRef.current = preserveMapView;
        },
        [preserveMapView],
    );

    useEffect(
        () => {
            if (isNotDefined(map) || isNotDefined(bounds) || preserveMapViewRef.current) {
                return;
            }

            map.fitBounds(bounds, { padding: defaultPaddingPixels });
        },
        [map, bounds],
    );
}

export default useNrwMapFitBounds;
