import {
    Chip,
    InfoPopup,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { _cs } from '@togglecorp/fujs';

import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

import i18n from './i18n.json';
import styles from './styles.module.css';

const alertClassStyles: Record<NrwEvent['alertClass'], string | undefined> = {
    low: styles.alertClassLow,
    medium: styles.alertClassMedium,
    high: styles.alertClassHigh,
};

export type NrwEventChipsEvent = Pick<NrwEvent, 'alertClass' | 'eventStatus' | 'trigger'>;

interface Props {
    className?: string;
    event: NrwEventChipsEvent;
}

function NrwEventChips(props: Props) {
    const { className, event } = props;

    const strings = useTranslation(i18n);

    const alertClassLabels: Record<NrwEvent['alertClass'], string> = {
        low: strings.nrwEventChipsAlertClassLow,
        medium: strings.nrwEventChipsAlertClassMedium,
        high: strings.nrwEventChipsAlertClassHigh,
    };

    const statusLabels: Record<NrwEvent['eventStatus'], string> = {
        imminent: strings.nrwEventChipsStatusImminent,
        ongoing: strings.nrwEventChipsStatusOngoing,
        ended: strings.nrwEventChipsStatusEnded,
    };

    const eventStatusLabel = (
        <span className={styles.eventStatusLabel}>
            {statusLabels[event.eventStatus]}
            {event.eventStatus === 'ended' && (
                <InfoPopup
                    className={styles.eventStatusIcon}
                    description={strings.nrwEventChipsStatusEndedDescription}
                />
            )}
        </span>
    );

    return (
        <div className={_cs(styles.nrwEventChips, className)}>
            <Chip
                className={_cs(styles.chip, alertClassStyles[event.alertClass])}
                name="alertClass"
                label={alertClassLabels[event.alertClass]}
            />
            <Chip
                className={_cs(styles.chip, styles.eventStatusChip)}
                name="eventStatus"
                label={eventStatusLabel}
            />
            {event.trigger && (
                <Chip
                    className={_cs(styles.chip, styles.triggerChip)}
                    name="trigger"
                    label={strings.nrwEventChipsTriggerReached}
                />
            )}
        </div>
    );
}

export default NrwEventChips;
