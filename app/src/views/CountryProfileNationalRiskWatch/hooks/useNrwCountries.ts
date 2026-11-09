import { useMemo } from 'react';

import { useNrwRequest } from '#utils/restRequest';

import { type NrwCountriesContextProps } from '../contexts/NrwCountriesContext';
import { type CountryCodeIso3 } from '../types';

function useNrwCountries(): NrwCountriesContextProps {
    const { response: countries, pending } = useNrwRequest({
        url: '/countries',
        apiType: 'nrw',
    });

    return useMemo(
        () => ({
            countries,
            supportedCountries: countries?.map(
                (country) => country.countryCodeIso3 as CountryCodeIso3,
            ),
            pending,
        }),
        [countries, pending],
    );
}

export default useNrwCountries;
