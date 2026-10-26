import { useMemo } from 'react';

import { useNrwRequest } from '#utils/restRequest';

import { type CountryCodeIso3 } from '../types';

interface NrwSupportedCountriesResult {
    supportedCountries: CountryCodeIso3[] | undefined;
    pending: boolean;
}

function useNrwSupportedCountries(): NrwSupportedCountriesResult {
    const { response: countries, pending } = useNrwRequest({
        url: '/countries',
        apiType: 'nrw',
    });

    const supportedCountries = useMemo(
        () => countries?.map((country) => country.countryCodeIso3 as CountryCodeIso3),
        [countries],
    );

    return { supportedCountries, pending };
}

export default useNrwSupportedCountries;
