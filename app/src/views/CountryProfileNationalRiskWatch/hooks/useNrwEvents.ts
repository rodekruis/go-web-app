import {
    type NrwApiUrlQuery,
    useNrwRequest,
} from '#utils/restRequest';

import { type CountryCodeIso3 } from '../types';

function useNrwEvents(countries: CountryCodeIso3[]) {
    const query: NrwApiUrlQuery<'/events'> = {
        countryCodeIso3: countries.length === 1 ? countries[0] : undefined,
    };

    const {
        response,
        pending,
        error,
    } = useNrwRequest({
        url: '/events',
        apiType: 'nrw',
        query,
        skip: countries.length === 0,
    });

    const events = response?.filter(
        (event) => countries.some((country) => country === event.countryCodeIso3),
    );

    return {
        events,
        pending,
        error,
    };
}

export default useNrwEvents;
