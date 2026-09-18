import {
    useMemo,
    useState,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import { useNrwRequest } from '#utils/restRequest';

import { type NrwEventsContextProps } from '../NrwEventsContext';
import {
    type CountryCodeIso3,
    type NrwEvent,
    type NrwEventIdChangeHandler,
} from '../types';

function useNrwEvents(props: {
    countries: CountryCodeIso3[] | undefined;
    selectedEventId: NrwEvent['eventId'] | undefined;
    onSelectedEventIdChange: NrwEventIdChangeHandler;
    active?: boolean;
}): NrwEventsContextProps {
    const {
        countries,
        selectedEventId,
        onSelectedEventIdChange,
        active = true,
    } = props;

    const { response: events, pending, error } = useNrwRequest({
        url: '/events',
        apiType: 'nrw',
        skip: !countries,
        query: { active, countryCodesIso3: countries?.length ? countries.join(',') : undefined },
    });

    const eventsPending = pending || !countries;

    const selectedEvent = events?.find((event) => event.eventId === selectedEventId);

    const [hoveredEventId, setHoveredEventId] = useState<NrwEvent['eventId'] | undefined>();

    return useMemo(
        () => ({
            events,
            pending: eventsPending,
            errored: isDefined(error),
            selectedEvent,
            hoveredEventId,
            onEventSelect: onSelectedEventIdChange,
            onEventHoverChange: setHoveredEventId,
        }),
        [
            events,
            eventsPending,
            error,
            selectedEvent,
            hoveredEventId,
            onSelectedEventIdChange,
            setHoveredEventId,
        ],
    );
}

export default useNrwEvents;
