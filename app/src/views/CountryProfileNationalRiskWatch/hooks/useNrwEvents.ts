import { useNrwRequest } from '#utils/restRequest';

import { type CountryCodeIso3 } from '../types';

function useNrwEvents(countries: CountryCodeIso3[]) {
    // For one country: pass the country code to the query to fetch data for only there.
    // For more than one country: pass no country to fetch all events, and then filter the results.
    // Making multi-country requests as a request for all countries is generally faster than
    // chaining calls to the backend API. The NRW API may be later made to support
    // multi-country requests, but for now this is the best approach.
    const singleCountry = countries.length === 1 ? countries[0] : undefined;

    const {
        response,
        pending,
        error,
    } = useNrwRequest({
        url: '/events',
        apiType: 'nrw',
        query: {
            countryCodeIso3: singleCountry,
        },
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
