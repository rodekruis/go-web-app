import { isFalsyString } from '@togglecorp/fujs';

import {
    type NrwApiUrlQuery,
    useNrwRequest,
} from '#utils/restRequest';

function useNrwEvents(props: NrwApiUrlQuery<'/events'>) {
    const {
        countryCodeIso3,
    } = props;

    const response = useNrwRequest({
        url: '/events',
        apiType: 'nrw',
        query: {
            countryCodeIso3,
        },
        skip: isFalsyString(countryCodeIso3),
    });

    return response;
}

export default useNrwEvents;
