import {
    useCallback,
    useMemo,
} from 'react';
import {
    Container,
    List,
    NumberOutput,
    RawButton,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';

import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

import NrwEventCard from './NrwEventCard';

import i18n from './i18n.json';
import styles from './styles.module.css';

const eventKeySelector = (event: NrwEvent) => event.eventId;

interface Props {
    className?: string;
    events: NrwEvent[] | undefined;
    pending: boolean;
    errored: boolean;
    selectedEvent: NrwEvent | undefined;
    hoveredEventId: NrwEvent['eventId'] | undefined;
    onEventSelect: (eventId: NrwEvent['eventId'] | undefined) => void;
    onEventHoverChange: (eventId: NrwEvent['eventId'] | undefined) => void;
}

function NrwEvents(props: Props) {
    const {
        className,
        events,
        pending,
        errored,
        selectedEvent,
        hoveredEventId,
        onEventSelect,
        onEventHoverChange,
    } = props;

    const strings = useTranslation(i18n);

    const visibleEvents = useMemo(
        () => (isDefined(selectedEvent) ? [selectedEvent] : events),
        [selectedEvent, events],
    );

    const handleToggle = useCallback(
        (eventId: NrwEvent['eventId']) => {
            onEventSelect(eventId === selectedEvent?.eventId ? undefined : eventId);
        },
        [selectedEvent, onEventSelect],
    );

    const handleShowAllEvents = useCallback(
        () => {
            onEventSelect(undefined);
        },
        [onEventSelect],
    );

    const rendererParams = useCallback(
        (_: NrwEvent['eventId'], event: NrwEvent) => ({
            event,
            expanded: event.eventId === selectedEvent?.eventId,
            hovered: event.eventId === hoveredEventId,
            onToggle: handleToggle,
            onHoverChange: onEventHoverChange,
        }),
        [selectedEvent, hoveredEventId, handleToggle, onEventHoverChange],
    );

    const heading = (
        <RawButton
            className={styles.heading}
            name={undefined}
            onClick={handleShowAllEvents}
            title={strings.nrwEventsShowAllEvents}
        >
            <span className={styles.headingLabel}>
                {strings.nrwEventsHeading}
            </span>
            {isDefined(events) && (
                <NumberOutput
                    className={styles.eventCount}
                    value={events.length}
                />
            )}
        </RawButton>
    );

    return (
        <Container
            className={_cs(styles.nrwEvents, className)}
            heading={heading}
            headingLevel={4}
            withPadding
            withBackground
            withShadow
            withContentOverflow
            spacing="md"
            withoutSpacingOpticalCorrection
        >
            <List
                className={styles.eventList}
                data={visibleEvents}
                keySelector={eventKeySelector}
                renderer={NrwEventCard}
                rendererParams={rendererParams}
                pending={pending}
                errored={errored}
                filtered={false}
                emptyMessage={strings.nrwEventsEmptyMessage}
                errorMessage={strings.nrwEventsErrorMessage}
                pendingMessage={strings.nrwEventsPendingMessage}
                compact
            />
        </Container>
    );
}

export default NrwEvents;
