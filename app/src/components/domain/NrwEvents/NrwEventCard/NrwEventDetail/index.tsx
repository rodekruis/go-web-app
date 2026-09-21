import {
    faCircleInfo,
    faClock,
    faDatabase,
    faMap,
    faTriangleExclamation,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from '@ifrc-go/ui/hooks';
import {
    formatDate,
    getNumberOfDays,
    resolveToString,
} from '@ifrc-go/ui/utils';
import { _cs } from '@togglecorp/fujs';

import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

import NrwExposedAdminAreas from './NrwExposedAdminAreas';

import i18n from './i18n.json';
import styles from './styles.module.css';

const detailDateFormat = 'dd-MM-yyyy';

interface Props {
    className?: string;
    event: NrwEvent;
}

function NrwEventDetail(props: Props) {
    const { className, event } = props;

    const strings = useTranslation(i18n);

    const now = new Date();
    const startAt = new Date(event.startAt);
    const isUpcoming = startAt.getTime() > now.getTime();
    const startDate = formatDate(event.startAt, detailDateFormat) ?? '';

    function getRelativeStart() {
        const daysUntilStart = getNumberOfDays(now, startAt);

        if (daysUntilStart === 0) {
            return strings.nrwEventDetailStartsToday;
        }

        if (daysUntilStart === 1) {
            return strings.nrwEventDetailStartsTomorrow;
        }

        return resolveToString(
            strings.nrwEventDetailStartsInDays,
            { days: daysUntilStart },
        );
    }

    return (
        <div className={_cs(styles.nrwEventDetail, className)}>
            <div className={styles.panels}>
                <div className={styles.fact}>
                    <FontAwesomeIcon className={styles.icon} icon={faClock} />
                    {isUpcoming
                        ? strings.nrwEventDetailStartsLabel
                        : strings.nrwEventDetailStartedLabel}
                    <span className={styles.factValue}>
                        {isUpcoming
                            ? resolveToString(
                                strings.nrwEventDetailStartValue,
                                { relative: getRelativeStart(), date: startDate },
                            )
                            : startDate}
                    </span>
                </div>
                <div className={styles.fact}>
                    <FontAwesomeIcon
                        className={styles.icon}
                        icon={event.trigger ? faTriangleExclamation : faCircleInfo}
                    />
                    {strings.nrwEventDetailAdvisoryLabel}
                    <span className={styles.factValue}>
                        {event.trigger
                            ? strings.nrwEventDetailAdvisoryTrigger
                            : strings.nrwEventDetailAdvisoryAlert}
                    </span>
                </div>
                <div className={styles.panel}>
                    <div className={styles.panelHeading}>
                        <FontAwesomeIcon className={styles.icon} icon={faMap} />
                        {strings.nrwEventDetailExposedAdminAreasHeading}
                    </div>
                    <NrwExposedAdminAreas event={event} />
                </div>
                {event.availableLayers.length > 0 && (
                    <div className={styles.panel}>
                        <div className={styles.panelHeading}>
                            <FontAwesomeIcon className={styles.icon} icon={faDatabase} />
                            {strings.nrwEventDetailDataSourcesHeading}
                        </div>
                        <div>
                            {event.availableLayers.map((layer) => (
                                <div className={styles.dataSource} key={layer.name}>
                                    {layer.label}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className={styles.timestamps}>
                {resolveToString(
                    strings.nrwEventDetailTimestamps,
                    {
                        created: formatDate(event.firstIssuedAt, detailDateFormat) ?? '',
                        updated: formatDate(event.lastUpdatedAt, detailDateFormat) ?? '',
                    },
                )}
            </div>
        </div>
    );
}

export default NrwEventDetail;
