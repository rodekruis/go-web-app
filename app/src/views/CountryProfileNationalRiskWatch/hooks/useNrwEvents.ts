import {
    useCallback,
    useMemo,
    useState,
} from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import { useNrwRequest } from '#utils/restRequest';

import { type NrwEventsContextProps } from '../contexts/NrwEventsContext';
import {
    type CountryCodeIso3,
    type NrwEvent,
    type NrwEventSelectHandler,
} from '../types';

function useNrwEvents(props: {
    countries: CountryCodeIso3[] | undefined;
    selectedEventId: NrwEvent['eventId'] | undefined;
    onSelectedEventIdChange: NrwEventSelectHandler;
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

    const handleEventChange = useCallback(
        (eventId: NrwEvent['eventId'] | undefined) => {
            if (isNotDefined(eventId)) {
                onSelectedEventIdChange(undefined, undefined);
                return;
            }

            const event = events?.find((candidate) => candidate.eventId === eventId);
            onSelectedEventIdChange(eventId, event?.hazardType);
        },
        [events, onSelectedEventIdChange],
    );

    return useMemo(
        () => ({
            events,
            pending: eventsPending,
            errored: isDefined(error),
            selectedEvent,
            hoveredEventId,
            onEventSelect: handleEventChange,
            onEventHoverChange: setHoveredEventId,
        }),
        [
            events,
            eventsPending,
            error,
            selectedEvent,
            hoveredEventId,
            handleEventChange,
            setHoveredEventId,
        ],
    );
}

export default useNrwEvents;
