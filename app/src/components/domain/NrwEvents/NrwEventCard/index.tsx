import {
    faAnglesRight,
    faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RawButton } from '@ifrc-go/ui';
import { _cs } from '@togglecorp/fujs';

import useHoverChange from '#hooks/useHoverChange';
import { alertClassNames } from '#utils/nrw/colors';
import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

import NrwEventChips from '../NrwEventChips';
import NrwEventName from '../NrwEventName';
import NrwEventDetail from './NrwEventDetail';

import styles from './styles.module.css';

interface Props {
    className?: string;
    event: NrwEvent;
    expanded: boolean;
    hovered: boolean;
    onToggle: (eventId: NrwEvent['eventId']) => void;
    onHoverChange: (eventId: NrwEvent['eventId'] | undefined) => void;
}

function NrwEventCard(props: Props) {
    const {
        className,
        event,
        expanded,
        hovered,
        onToggle,
        onHoverChange,
    } = props;

    const { handleMouseEnter, handleMouseLeave } = useHoverChange(event.eventId, onHoverChange);

    return (
        <div
            className={_cs(
                styles.nrwEventCard,
                alertClassNames[event.alertClass],
                expanded && styles.expanded,
                hovered && styles.hovered,
                className,
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
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
