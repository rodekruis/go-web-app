import {
    faBell,
    faHouseFloodWater,
    faHurricane,
    faSunPlantWilt,
    type IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { _cs } from '@togglecorp/fujs';

import { type NrwApiResponse } from '#utils/restRequest';
import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';

import styles from './styles.module.css';

type NrwEvent = NrwApiResponse<'/events'>[number];

const hazardIcons: Record<NrwEvent['hazardType'], IconDefinition> = {
    floods: faHouseFloodWater,
    drought: faSunPlantWilt,
    tropicalCyclone: faHurricane,
};

const alertClassStyles: Record<NrwEvent['alertClass'], string> = {
    low: styles.pinLow,
    medium: styles.pinMedium,
    high: styles.pinHigh,
};

// Teardrop body + outline paths taken 1:1 from the Figma "Hazard pin" asset
// (viewBox cropped to the 24x32 pin body; outline overflows it slightly).
const PIN_BODY_PATH = 'M28 12C21.375 12 16 17.2443 16 23.7188C16 31.1317 23.5125 40.0171 26.65 43.4035C27.3875 44.1988 28.6125 44.1988 29.35 43.4035C32.4875 40.0171 40 31.1317 40 23.7188C40 17.2443 34.625 12 28 12Z';
const PIN_OUTLINE_PATH = 'M28 11C35.1545 11 41 16.6695 41 23.7188C41 27.72 38.9909 31.9963 36.6953 35.6074C34.3798 39.2498 31.6733 42.3676 30.084 44.083H30.083C28.9498 45.3051 27.0502 45.3051 25.917 44.083H25.916C24.3267 42.3676 21.6202 39.2498 19.3047 35.6074C17.0091 31.9963 15 27.72 15 23.7188C15 16.6695 20.8455 11 28 11Z';

export default function NrwMapMarker(props: {
    id: string;
    coordinates: NrwLngLat;
    alertClass: NrwEvent['alertClass'];
    hazardType: NrwEvent['hazardType'];
    trigger: boolean;
}) {
    const {
        alertClass,
        hazardType,
        trigger,
    } = props;

    return (
        <div
            className={_cs(
                styles.hazardPin,
                trigger ? styles.pinTrigger : alertClassStyles[alertClass],
            )}
        >
            <div className={styles.pinInner}>
                <svg
                    viewBox="16 12 24 32"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        className={styles.pinBody}
                        d={PIN_BODY_PATH}
                    />
                    <path
                        className={styles.pinOutline}
                        d={PIN_OUTLINE_PATH}
                    />
                </svg>
                <FontAwesomeIcon
                    icon={hazardIcons[hazardType] ?? faBell}
                    className={styles.icon}
                />
            </div>
        </div>
    );
}
