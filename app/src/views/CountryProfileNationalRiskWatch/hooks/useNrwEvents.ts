import { useMemo } from 'react';
import { isFalsyString } from '@togglecorp/fujs';

import {
    type NrwApiUrlQuery,
    useNrwRequest,
} from '#utils/restRequest';

function useNrwEvents(props: NrwApiUrlQuery<'/events'>) {
    const {
        countryCodeIso3,
    } = props;

    const query = useMemo(
        () => ({
            countryCodeIso3,
        }),
        [countryCodeIso3],
    );

    const response = useNrwRequest({
        url: '/events',
        apiType: 'nrw',
        query,
        skip: isFalsyString(countryCodeIso3),
    });

    return response;
}

export default useNrwEvents;
