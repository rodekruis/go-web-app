import {
    type NrwApiUrlQuery,
    useNrwRequest,
} from '#utils/restRequest';

import { type CountryCodeIso3 } from '../types';

function useNrwEvents(countries: CountryCodeIso3[]) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const results = countries.map((country) => useNrwRequest({
        url: '/events',
        apiType: 'nrw',
        query: {
            countryCodeIso3: country,
        } satisfies NrwApiUrlQuery<'/events'>,
    }));

    const pending = results.some((result) => result.pending);
    const error = results.find((result) => result.error)?.error;

    const events = results.flatMap(
        (result) => result.response ?? [],
    ).filter(
        (event) => countries.some((country) => country === event.countryCodeIso3),
    );

    return {
        events: countries.length === 0 ? undefined : events,
        pending,
        error,
    };
}

export default useNrwEvents;
