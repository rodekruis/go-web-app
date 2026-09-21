import { useMemo } from 'react';
import { faLocationDot } from '@fortawesome/pro-regular-svg-icons';
import { faPersonRays } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NumberOutput } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { resolveToString } from '@ifrc-go/ui/utils';
import { _cs } from '@togglecorp/fujs';

import {
    getNrwExposedAdminAreas,
    getNrwExposedPopulation,
    getNrwTotalExposedPopulation,
} from '#utils/nrw/events';
import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

import i18n from './i18n.json';
import styles from './styles.module.css';

interface Props {
    className?: string;
    event: NrwEvent;
}

function NrwExposedAdminAreas(props: Props) {
    const { className, event } = props;

    const strings = useTranslation(i18n);

    // TODO: use the admin level label from the event country once the country object provides it
    const adminAreaLabel = strings.nrwExposedAdminAreasFallbackLabel;

    const exposedAdminAreas = useMemo(() => getNrwExposedAdminAreas(event), [event]);

    const totalExposedPopulation = useMemo(
        () => getNrwTotalExposedPopulation(exposedAdminAreas),
        [exposedAdminAreas],
    );

    if (exposedAdminAreas.length === 0) {
        return (
            <div className={_cs(styles.nrwExposedAdminAreas, styles.emptyMessage, className)}>
                {resolveToString(strings.nrwExposedAdminAreasEmptyMessage, { adminAreaLabel })}
            </div>
        );
    }

    return (
        <div className={_cs(styles.nrwExposedAdminAreas, className)}>
            <div className={styles.exposedAdminAreaTotals}>
                <div>
                    {resolveToString(strings.nrwExposedAdminAreasTotalAreas, { adminAreaLabel })}
                    <NumberOutput
                        className={styles.exposedAdminAreaTotalValue}
                        value={exposedAdminAreas.length}
                    />
                </div>
                <div>
                    {strings.nrwExposedAdminAreasTotalPopulation}
                    <NumberOutput
                        className={styles.exposedAdminAreaTotalValue}
                        value={totalExposedPopulation}
                        invalidText="--"
                    />
                </div>
            </div>
            <table className={styles.exposedAdminAreasTable}>
                <thead>
                    <tr>
                        <th>
                            <span className={styles.columnHeading}>
                                <FontAwesomeIcon icon={faLocationDot} />
                                {resolveToString(
                                    strings.nrwExposedAdminAreasAreaColumn,
                                    { adminAreaLabel },
                                )}
                            </span>
                        </th>
                        <th>
                            <span className={styles.columnHeading}>
                                <FontAwesomeIcon icon={faPersonRays} />
                                {strings.nrwExposedAdminAreasPopulationColumn}
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {exposedAdminAreas.map((area) => (
                        <tr key={area.placeCode}>
                            <td>
                                <span className={styles.adminAreaName}>
                                    {area.name}
                                </span>
                            </td>
                            <td>
                                <NumberOutput
                                    value={getNrwExposedPopulation(area)}
                                    invalidText="--"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default NrwExposedAdminAreas;
