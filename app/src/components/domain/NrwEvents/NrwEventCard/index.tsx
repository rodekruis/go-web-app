import { useId } from 'react';
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
    onSelect: (eventId: NrwEvent['eventId']) => void;
    onHoverChange: (eventId: NrwEvent['eventId'] | undefined) => void;
}

function NrwEventCard(props: Props) {
    const {
        className,
        event,
        expanded,
        hovered,
        onSelect,
        onHoverChange,
    } = props;

    const { handleMouseEnter, handleMouseLeave } = useHoverChange(event.eventId, onHoverChange);
    const headerId = useId();

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
            <div id={headerId} className={styles.header}>
                {!expanded && (
                    <RawButton
                        className={styles.openButton}
                        name={event.eventId}
                        onClick={onSelect}
                        aria-labelledby={headerId}
                    />
                )}
                <NrwEventChips className={styles.chips} event={event} />
                <NrwEventName event={event} />
            </div>
            {expanded && (
                <NrwEventDetail className={styles.detail} event={event} />
            )}
        </div>
    );
}

export default NrwEventCard;
