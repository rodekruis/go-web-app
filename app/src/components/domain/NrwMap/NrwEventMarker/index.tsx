import {
    useCallback,
    useEffect,
    useRef,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { _cs } from '@togglecorp/fujs';

import NrwEventMarkerIcon from '#assets/icons/nrw/event-marker.svg?react';
import hazardIcons from '#utils/nrw/hazardIcons';
import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

import styles from './styles.module.css';

const alertClassStyles: Record<NrwEvent['alertClass'], string | undefined> = {
    low: styles.alertLow,
    medium: styles.alertMedium,
    high: styles.alertHigh,
};

interface Props {
    eventId: NrwEvent['eventId'];
    alertClass: NrwEvent['alertClass'];
    hazardType: NrwEvent['hazardType'];
    onHoverChange: (eventId: NrwEvent['eventId'] | undefined) => void;
}

export default function NrwEventMarker(props: Props) {
    const {
        eventId,
        alertClass,
        hazardType,
        onHoverChange,
    } = props;

    const hoveredRef = useRef(false);

    const handleMouseEnter = useCallback(() => {
        hoveredRef.current = true;
        onHoverChange(eventId);
    }, [eventId, onHoverChange]);

    const handleMouseLeave = useCallback(() => {
        hoveredRef.current = false;
        onHoverChange(undefined);
    }, [onHoverChange]);

    useEffect(() => () => {
        if (hoveredRef.current) {
            onHoverChange(undefined);
        }
    }, [onHoverChange]);

    return (
        <div
            className={_cs(
                styles.eventMarker,
                alertClassStyles[alertClass],
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className={styles.eventMarkerInner}>
                <NrwEventMarkerIcon className={styles.eventMarkerGraphic} />
                <FontAwesomeIcon
                    icon={hazardIcons[hazardType]}
                    className={styles.hazardIcon}
                />
            </div>
        </div>
    );
}
