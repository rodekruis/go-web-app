import { createContext } from 'react';

import {
    type NrwEvent,
    type NrwEventIdChangeHandler,
} from '../types';

export interface NrwEventsContextProps {
    events: NrwEvent[] | undefined;
    pending: boolean;
    errored: boolean;
    selectedEvent: NrwEvent | undefined;
    hoveredEventId: NrwEvent['eventId'] | undefined;
    onEventSelect: NrwEventIdChangeHandler;
    onEventHoverChange: NrwEventIdChangeHandler;
}

const NrwEventsContext = createContext<NrwEventsContextProps>({
    events: undefined,
    pending: false,
    errored: false,
    selectedEvent: undefined,
    hoveredEventId: undefined,
    onEventSelect: () => {
        // eslint-disable-next-line no-console
        console.warn('NrwEventsContext::onEventSelect called before it was initialized');
    },
    onEventHoverChange: () => {
        // eslint-disable-next-line no-console
        console.warn('NrwEventsContext::onEventHoverChange called before it was initialized');
    },
});

export default NrwEventsContext;
