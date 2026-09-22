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
}) {
    const {
        countries, adminLevel, parentPlaceCode, skip, onSuccess,
    } = options;

    const { response, error } = useNrwRequest({
        url: '/admin-areas',
        apiType: 'nrw',
        skip: skip || !countries?.length,
        query: getAdminAreasQuery(countries ?? [], adminLevel, parentPlaceCode),
        onSuccess,
    });

    return { adminAreas: response, error };
}

export default useNrwAdminAreas;
