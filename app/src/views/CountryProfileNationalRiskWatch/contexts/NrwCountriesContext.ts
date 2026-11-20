import { createContext } from 'react';

import {
    type CountryCodeIso3,
    type NrwCountry,
} from '../types';

export interface NrwCountriesContextProps {
    countries: NrwCountry[] | undefined;
    supportedCountries: CountryCodeIso3[] | undefined;
    pending: boolean;
}

const NrwCountriesContext = createContext<NrwCountriesContextProps>({
    countries: undefined,
    supportedCountries: undefined,
    pending: false,
});

export default NrwCountriesContext;
