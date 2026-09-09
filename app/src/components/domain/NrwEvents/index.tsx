import { useCallback } from 'react';
import {
    Container,
    List,
    NumberOutput,
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
}

function NrwEvents(props: Props) {
    const {
        className, events, pending, errored,
    } = props;

    const strings = useTranslation(i18n);

    const rendererParams = useCallback(
        (_: NrwEvent['eventId'], event: NrwEvent) => ({ event }),
        [],
    );

    const heading = (
        <span className={styles.heading}>
            <span className={styles.headingLabel}>
                {strings.nrwEventsHeading}
            </span>
            {isDefined(events) && (
                <NumberOutput
                    className={styles.eventCount}
                    value={events.length}
                />
            )}
        </span>
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
                data={events}
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
