import {
    faAnglesRight,
    faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RawButton } from '@ifrc-go/ui';
import { _cs } from '@togglecorp/fujs';

import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

import NrwEventChips from '../NrwEventChips';
import NrwEventName from '../NrwEventName';
import NrwEventDetail from './NrwEventDetail';

import styles from './styles.module.css';

const alertClassStyles: Record<NrwEvent['alertClass'], string | undefined> = {
    low: styles.alertClassLow,
    medium: styles.alertClassMedium,
    high: styles.alertClassHigh,
};

interface Props {
    className?: string;
    event: NrwEvent;
    expanded: boolean;
    hovered: boolean;
    onToggle: (eventId: NrwEvent['eventId']) => void;
}

function NrwEventCard(props: Props) {
    const {
        className,
        event,
        expanded,
        hovered,
        onToggle,
    } = props;

    return (
        <div
            className={_cs(
                styles.nrwEventCard,
                alertClassStyles[event.alertClass],
                expanded && styles.expanded,
                hovered && styles.hovered,
                className,
            )}
        >
            <div className={styles.header}>
                <div className={styles.chipRow}>
                    <NrwEventChips className={styles.chips} event={event} />
                    <RawButton
                        className={styles.toggleButton}
                        name={event.eventId}
                        onClick={onToggle}
                        aria-expanded={expanded}
                    >
                        <FontAwesomeIcon icon={expanded ? faXmark : faAnglesRight} />
                    </RawButton>
                </div>
                <NrwEventName event={event} />
            </div>
            {expanded && (
                <NrwEventDetail className={styles.detail} event={event} />
            )}
        </div>
    );
}

export default NrwEventCard;
