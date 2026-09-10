import { useNrwRequest } from '#utils/restRequest';

import { type CountryCodeIso3 } from '../types';

function useNrwEvents(countries: CountryCodeIso3[] | undefined, active: boolean = true) {
    const { response, pending, error } = useNrwRequest({
        url: '/events',
        apiType: 'nrw',
        skip: !countries,
        query: { active, countryCodesIso3: countries?.length ? countries.join(',') : undefined },
    });

    return {
        events: response,
        pending: pending || !countries,
        error,
    };
}

export default useNrwEvents;
