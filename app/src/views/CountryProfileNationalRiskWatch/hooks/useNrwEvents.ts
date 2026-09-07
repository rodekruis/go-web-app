import { useNrwRequest } from '#utils/restRequest';

import { type CountryCodeIso3 } from '../types';

function useNrwEvents(countries: CountryCodeIso3[] | undefined) {
    const {
        response,
        pending,
        error,
    } = useNrwRequest({
        url: '/events',
        apiType: 'nrw',
        skip: !countries,
        query: { countryCodesIso3: countries?.length ? countries.join(',') : undefined },
    });

    return {
        events: response,
        pending: pending || !countries,
        error,
    };
}

export default useNrwEvents;
