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

    const isQueryable = !skip && (countries?.length ?? 0) > 0;

    const { response, pending } = useNrwRequest({
        url: '/admin-areas',
        apiType: 'nrw',
        skip: !isQueryable,
        query: getAdminAreasQuery(countries ?? [], adminLevel, parentPlaceCode, placeCodes),
        preserveResponse: true,
        onSuccess,
        onFailure,
    });

    // Nothing to show when there is nothing to fetch.
    const adminAreas = isQueryable ? response : undefined;

    return { adminAreas, pending };
}

export default useNrwAdminAreas;
