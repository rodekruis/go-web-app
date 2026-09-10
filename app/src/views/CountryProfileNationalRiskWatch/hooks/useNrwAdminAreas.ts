import { useNrwRequest } from '#utils/restRequest';

import {
    type AdminLevel,
    type CountryCodeIso3,
} from '../types';
import { getAdminAreasQuery } from '../utils';

function useNrwAdminAreas(options: {
    countries: CountryCodeIso3[] | undefined;
    adminLevels: AdminLevel[];
    skip: boolean;
}) {
    const { countries, adminLevels, skip } = options;

    const { response, error } = useNrwRequest({
        url: '/admin-areas',
        apiType: 'nrw',
        skip: skip || !countries?.length,
        query: getAdminAreasQuery(countries ?? [], adminLevels),
    });

    return { adminAreas: response, error };
}

export default useNrwAdminAreas;
