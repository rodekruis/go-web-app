import { useMemo } from 'react';

import { useNrwRequest } from '#utils/restRequest';

import { type CountryCodeIso3 } from '../types';

function useNrwEvents(countries: CountryCodeIso3[]) {
    const isSingleCountry = countries.length === 1;

    const {
        response,
        pending,
        error,
    } = useNrwRequest({
        url: '/events',
        apiType: 'nrw',
        // For one country: pass the country code to the query to fetch data for only there.
        // For more than one country: pass no country to fetch all events and filter the results.
        ...(isSingleCountry && {
            query: { countryCodeIso3: countries[0] },
        }),
    });

    // Use memo here to prevent spamming dependencies with a new `events` reference.
    // This would be hit every map pan/zoom.
    const events = useMemo(
        () => response?.filter(
            ({ countryCodeIso3 }) => countries.includes(countryCodeIso3 as CountryCodeIso3),
        ),
        [response, countries],
    );

    return {
        events,
        pending,
        error,
    };
}

export default useNrwEvents;
