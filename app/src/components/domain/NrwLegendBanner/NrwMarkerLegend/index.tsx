import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { _cs } from '@togglecorp/fujs';

import { alertClassNames } from '#utils/nrw/colors';
import hazardIcons from '#utils/nrw/hazardIcons';
import {
    type NrwEvent,
    type NrwEventHazardType,
} from '#views/CountryProfileNationalRiskWatch/types';

import i18n from './i18n.json';
import styles from './styles.module.css';

const alertClasses: NrwEvent['alertClass'][] = ['low', 'medium', 'high'];

function NrwMarkerLegend() {
    const strings = useTranslation(i18n);

    const alertClassLabels: Record<NrwEvent['alertClass'], string> = {
        low: strings.nrwMarkerLegendAlertLow,
        medium: strings.nrwMarkerLegendAlertMedium,
        high: strings.nrwMarkerLegendAlertHigh,
    };
    const hazardTypeLabels: Partial<Record<NrwEventHazardType, string>> = {
        floods: strings.nrwMarkerLegendHazardFloods,
    };
    const supportedHazardTypes = Object.keys(hazardTypeLabels) as NrwEventHazardType[];

    return (
        <div className={styles.nrwMarkerLegend}>
            <div className={styles.group}>
                <div className={styles.label}>
                    {strings.nrwMarkerLegendAlertLevelLabel}
                </div>
                <div className={styles.entries}>
                    {alertClasses.map((alertClass) => (
                        <div
                            key={alertClass}
                            className={styles.entry}
                        >
                            <span
                                className={_cs(
                                    styles.alertMarker,
                                    alertClassNames[alertClass],
                                )}
                            />
                            {alertClassLabels[alertClass]}
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.group}>
                <div className={styles.label}>
                    {strings.nrwMarkerLegendEventTypeLabel}
                </div>
                <div className={_cs(styles.entries, styles.hazardEntries)}>
                    {supportedHazardTypes.map((hazardType) => (
                        <div
                            key={hazardType}
                            className={styles.entry}
                        >
                            <span className={styles.hazardMarker}>
                                <FontAwesomeIcon
                                    icon={hazardIcons[hazardType]}
                                    className={styles.hazardIcon}
                                />
                            </span>
                            {hazardTypeLabels[hazardType]}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default NrwMarkerLegend;
