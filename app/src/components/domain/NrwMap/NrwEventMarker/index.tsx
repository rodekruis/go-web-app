import {
    faHouseFloodWater,
    faHurricane,
    faSunPlantWilt,
    type IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { _cs } from '@togglecorp/fujs';

import NrwEventMarkerIcon from '#assets/icons/nrw/event-marker.svg?react';
import { type NrwApiResponse } from '#utils/restRequest';

import styles from './styles.module.css';

type NrwEvent = NrwApiResponse<'/events'>[number];

const hazardIcons: Record<NrwEvent['hazardType'], IconDefinition> = {
    floods: faHouseFloodWater,
    drought: faSunPlantWilt,
    tropicalCyclone: faHurricane,
};

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
