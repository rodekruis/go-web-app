import {
    useCallback,
    useState,
} from 'react';
import {
    faChevronDown,
    faChevronUp,
    faGaugeHigh,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RawButton } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { resolveToString } from '@ifrc-go/ui/utils';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';

import { alertClassNames } from '#utils/nrw/colors';
import {
    type NrwEvent,
    type NrwFloodsDetails,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwRiverDischargeChart from './NrwRiverDischargeChart';

import i18n from './i18n.json';
import styles from './styles.module.css';

interface Props {
    className?: string;
    floodsDetails: NrwFloodsDetails;
    alertClass: NrwEvent['alertClass'];
    startAt: NrwEvent['startAt'];
}

function NrwFloodsEventDetails(props: Props) {
    const {
        className,
        floodsDetails,
        alertClass,
        startAt,
    } = props;
    const { stationCode, stationName, alertDetails: { returnPeriod } } = floodsDetails;

    const strings = useTranslation(i18n);
    const [expanded, setExpanded] = useState(false);

    const handleToggle = useCallback(() => {
        setExpanded((previousExpanded) => !previousExpanded);
    }, []);

    return (
        <div
            className={_cs(
                styles.nrwFloodsEventDetails,
                alertClassNames[alertClass],
                className,
            )}
        >
            <RawButton
                className={styles.header}
                name={undefined}
                onClick={handleToggle}
                aria-expanded={expanded}
            >
                <span className={styles.summary}>
                    <FontAwesomeIcon
                        className={styles.icon}
                        icon={faGaugeHigh}
                        widthAuto
                    />
                    {strings.nrwFloodsEventDetailsLabel}
                    <span className={styles.alertDot} />
                    <span className={styles.summaryValue}>
                        {isDefined(returnPeriod)
                            ? resolveToString(
                                strings.nrwFloodsEventDetailsReturnPeriod,
                                { returnPeriod },
                            )
                            : strings.nrwFloodsEventDetailsNoReturnPeriod}
                    </span>
                </span>
                <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
            </RawButton>
            {expanded && (
                <div className={styles.details}>
                    <div className={styles.station}>
                        <span className={styles.stationDot}>
                            <span className={styles.alertDot} />
                        </span>
                        {isDefined(stationName)
                            ? `${stationCode} - ${stationName}`
                            : stationCode}
                    </div>
                    <NrwRiverDischargeChart
                        floodsDetails={floodsDetails}
                        alertClass={alertClass}
                        startAt={startAt}
                    />
                </div>
            )}
        </div>
    );
}

export default NrwFloodsEventDetails;
