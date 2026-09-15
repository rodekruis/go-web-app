import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { _cs } from '@togglecorp/fujs';

import NrwEventMarkerIcon from '#assets/icons/nrw/event-marker.svg?react';
import NrwEventName, { type NrwEventNameEvent } from '#components/domain/NrwEvents/NrwEventName';
import useHoverChange from '#hooks/useHoverChange';
import hazardIcons from '#utils/nrw/hazardIcons';
import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

import styles from './styles.module.css';

const alertClassStyles: Record<NrwEvent['alertClass'], string | undefined> = {
    low: styles.alertLow,
    medium: styles.alertMedium,
    high: styles.alertHigh,
};

// Pick NrwEvent props used in the NrwEventMarker component
type NrwEventMarkerEvent = NrwEventNameEvent & Pick<NrwEvent, 'eventId' | 'alertClass'>;

interface Props {
    event: NrwEventMarkerEvent;
    hovered: boolean;
    onHoverChange: (eventId: NrwEvent['eventId'] | undefined) => void;
}

export default function NrwEventMarker(props: Props) {
    const {
        event,
        hovered,
        onHoverChange,
    } = props;

    const { handleMouseEnter, handleMouseLeave } = useHoverChange(event.eventId, onHoverChange);

    return (
        <div
            className={_cs(
                styles.eventMarker,
                alertClassStyles[event.alertClass],
                hovered && styles.hovered,
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className={styles.eventMarkerInner}>
                <NrwEventMarkerIcon className={styles.eventMarkerGraphic} />
                <FontAwesomeIcon
                    icon={hazardIcons[event.hazardType]}
                    className={styles.hazardIcon}
                />
            </div>
            <NrwEventName
                className={styles.popup}
                event={event}
                stacked
            />
        </div>
    );
}
