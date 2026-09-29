import {
    useCallback,
    useState,
} from 'react';

import { useNrwRequest } from '#utils/restRequest';

import {
    type AdminLevel,
    type CountryCodeIso3,
    type NrwAdminAreaFeatureCollection,
    type PlaceCode,
} from '../types';
import { getAdminAreasQuery } from '../utils';

function useNrwAdminAreas(options: {
    countries: CountryCodeIso3[] | undefined;
    adminLevel: AdminLevel;
    parentPlaceCode?: PlaceCode;
    placeCodes?: PlaceCode[];
    skip: boolean;
    onSuccess?: (adminAreas: NrwAdminAreaFeatureCollection) => void;
    onFailure?: () => void;
}) {
    const {
        countries, adminLevel, parentPlaceCode, placeCodes, skip, onSuccess, onFailure,
    } = options;

    const [lastAdminAreas, setAdminAreas] = useState<NrwAdminAreaFeatureCollection>();
    const isQueryable = !skip && (countries?.length ?? 0) > 0;

    // The last admin areas stay while the next level loads, also when it
    // turns out to be empty, as the caller then backs up to the last level.
    const handleSuccess = useCallback(
        (response: NrwAdminAreaFeatureCollection) => {
            if (response.features.length > 0) {
                setAdminAreas(response);
            }
            onSuccess?.(response);
        },
        [onSuccess],
    );

    const { pending, error } = useNrwRequest({
        url: '/admin-areas',
        apiType: 'nrw',
        skip: !isQueryable,
        query: getAdminAreasQuery(countries ?? [], adminLevel, parentPlaceCode, placeCodes),
        preserveResponse: true,
        onSuccess: handleSuccess,
        onFailure,
    });

    // Nothing to show when there is nothing to fetch.
    const adminAreas = isQueryable ? lastAdminAreas : undefined;

    return { adminAreas, pending, error };
}

export default useNrwAdminAreas;
