import { useMemo } from 'react';
import { isFalsyString } from '@togglecorp/fujs';

import {
    type NrwApiUrlQuery,
    useNrwRequest,
} from '#utils/restRequest';

function useNrwEvents(props: NrwApiUrlQuery<'/events'>) {
    const {
        countryCodeIso3,
        active = true,
        timestamp,
    } = props;

    const query = useMemo(
        () => ({
            countryCodeIso3,
            active,
            timestamp,
        }),
        [countryCodeIso3, active, timestamp],
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
