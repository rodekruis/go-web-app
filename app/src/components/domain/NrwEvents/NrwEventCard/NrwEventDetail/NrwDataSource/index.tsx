import {
    faChevronDown,
    faChevronUp,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RawButton } from '@ifrc-go/ui';
import {
    useBooleanState,
    useTranslation,
} from '@ifrc-go/ui/hooks';
import { _cs } from '@togglecorp/fujs';

import { type NrwForecastSource } from '#views/CountryProfileNationalRiskWatch/types';

import i18n from './i18n.json';
import styles from './styles.module.css';

interface Props {
    forecastSource: NrwForecastSource;
}

function NrwDataSource(props: Props) {
    const { forecastSource } = props;

    const strings = useTranslation(i18n);
    const [expanded, { toggle: toggleExpanded }] = useBooleanState(false);

    return (
        <div className={styles.nrwDataSource}>
            <RawButton
                className={styles.header}
                name={undefined}
                onClick={toggleExpanded}
                aria-expanded={expanded}
            >
                {forecastSource.title}
                <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
            </RawButton>
            {expanded && (
                <ul className={styles.details}>
                    <li>
                        {strings.nrwDataSourceDatasetLabel}
                        <span className={styles.value}>{forecastSource.dataset}</span>
                    </li>
                    <li>
                        {strings.nrwDataSourceProviderLabel}
                        <span className={styles.value}>{forecastSource.provider}</span>
                    </li>
                    <li>
                        {strings.nrwDataSourceLastUpdatedLabel}
                        <span className={styles.value}>{forecastSource.lastUpdated}</span>
                    </li>
                    <li>
                        {strings.nrwDataSourceDescriptionLabel}
                        <span className={styles.value}>{forecastSource.description}</span>
                    </li>
                    <li>
                        {strings.nrwDataSourceMoreInfoLabel}
                        <a
                            className={_cs(styles.value, styles.link)}
                            href={forecastSource.moreInfoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {forecastSource.moreInfoLabel}
                        </a>
                    </li>
                </ul>
            )}
        </div>
    );
}

export default NrwDataSource;
