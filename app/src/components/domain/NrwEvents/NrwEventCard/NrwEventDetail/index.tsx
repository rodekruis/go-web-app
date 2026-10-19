import {
    useCallback,
    useContext,
    useState,
} from 'react';
import {
    faBullhorn,
    faChevronLeft,
    faClock,
    faDatabase,
    faMap,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import {
    formatDate,
    getNumberOfDays,
    resolveToString,
} from '@ifrc-go/ui/utils';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';

import { getNrwSortedForecastSources } from '#utils/nrw/events';
import NrwAdminAreasContext from '#views/CountryProfileNationalRiskWatch/NrwAdminAreasProvider/NrwAdminAreasContext';
import {
    type NrwEvent,
    type NrwForecastSource,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwDataSource from './NrwDataSource';
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
    const { parentAdminArea, drillUp } = useContext(NrwAdminAreasContext);
    const [
        expandedForecastSourceName,
        setExpandedForecastSourceName,
    ] = useState<NrwForecastSource['name']>();

    const handleForecastSourceToggle = useCallback((name: NrwForecastSource['name']) => {
        setExpandedForecastSourceName(
            (previousName) => (previousName === name ? undefined : name),
        );
    }, []);

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
                    <FontAwesomeIcon className={styles.icon} icon={faBullhorn} />
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
                        {isDefined(parentAdminArea) && (
                            <Button
                                className={styles.backButton}
                                name={undefined}
                                colorVariant="text"
                                textSize="md"
                                spacingOffset={-2}
                                before={<FontAwesomeIcon icon={faChevronLeft} />}
                                onClick={drillUp}
                                data-nrw-capture-exclude
                            >
                                {strings.nrwEventDetailBackButton}
                            </Button>
                        )}
                    </div>
                    <NrwExposedAdminAreas event={event} />
                </div>
                {event.forecastSources.length > 0 && (
                    <div className={styles.panel}>
                        <div className={styles.panelHeading}>
                            <FontAwesomeIcon className={styles.icon} icon={faDatabase} />
                            {strings.nrwEventDetailDataSourcesHeading}
                        </div>
                        <div>
                            {getNrwSortedForecastSources(event).map((forecastSource) => (
                                <NrwDataSource
                                    key={forecastSource.name}
                                    forecastSource={forecastSource}
                                    expanded={forecastSource.name === expandedForecastSourceName}
                                    onToggle={handleForecastSourceToggle}
                                />
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
