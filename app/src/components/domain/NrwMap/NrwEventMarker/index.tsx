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
    alertClass: NrwEvent['alertClass'];
    hazardType: NrwEvent['hazardType'];
    trigger: boolean;
}

export default function NrwEventMarker(props: Props) {
    const {
        alertClass,
        hazardType,
        trigger,
    } = props;

    return (
        <div
            className={_cs(
                styles.eventMarker,
                trigger ? styles.alertTrigger : alertClassStyles[alertClass],
            )}
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
