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
    skip: boolean;
    onSuccess?: (adminAreas: NrwAdminAreaFeatureCollection) => void;
    onFailure?: () => void;
}) {
    const {
        countries, adminLevel, parentPlaceCode, skip, onSuccess, onFailure,
    } = options;

    const [adminAreas, setAdminAreas] = useState<NrwAdminAreaFeatureCollection>();

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
        skip: skip || !countries?.length,
        query: getAdminAreasQuery(countries ?? [], adminLevel, parentPlaceCode),
        preserveResponse: true,
        onSuccess: handleSuccess,
        onFailure,
    });

    return { adminAreas, pending, error };
}

export default useNrwAdminAreas;
