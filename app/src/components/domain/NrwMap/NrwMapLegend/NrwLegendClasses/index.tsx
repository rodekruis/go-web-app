import { useTranslation } from '@ifrc-go/ui/hooks';
import {
    formatNumber,
    resolveToString,
} from '@ifrc-go/ui/utils';
import { isDefined } from '@togglecorp/fujs';

import {
    type NrwLegendClass,
    type NrwLegendItem,
    type NrwLegendType,
} from '#views/CountryProfileNationalRiskWatch/types';

import i18n from './i18n.json';
import styles from './styles.module.css';

function formatBound(value: number): string {
    // The formatNumber overloads resolve to undefined for a plain number.
    return formatNumber(Math.round(value), { compact: true, maximumFractionDigits: 1 })
        ?? String(Math.round(value));
}

function NrwLegendClasses(props: {
    item: Extract<NrwLegendItem, { type: NrwLegendType.Classes }>;
}) {
    const { item } = props;

    const strings = useTranslation(i18n);

    const getClassLabel = (legendClass: NrwLegendClass): string => {
        const { from, to } = legendClass;

        if (isDefined(from) && isDefined(to)) {
            return resolveToString(strings.nrwLegendClassesRange, {
                from: formatBound(from),
                to: formatBound(to),
            });
        }
        if (isDefined(to)) {
            return resolveToString(strings.nrwLegendClassesBelow, { value: formatBound(to) });
        }
        if (isDefined(from)) {
            return resolveToString(strings.nrwLegendClassesAbove, { value: formatBound(from) });
        }
        return '';
    };

    return (
        <div className={styles.nrwLegendClasses}>
            <div className={styles.label}>
                {`${item.label}:`}
            </div>
            <div className={styles.classes}>
                {item.classes.map((legendClass) => (
                    <div
                        key={legendClass.color}
                        className={styles.class}
                    >
                        <div
                            className={styles.swatch}
                            style={{ backgroundColor: legendClass.color }}
                        />
                        <span className={styles.classLabel}>
                            {getClassLabel(legendClass)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default NrwLegendClasses;
