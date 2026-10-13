import { useTranslation } from '@ifrc-go/ui/hooks';
import {
    formatNumber,
    resolveToString,
} from '@ifrc-go/ui/utils';
import { isDefined } from '@togglecorp/fujs';

import {
    type NrwLegendCategory,
    type NrwLegendItem,
    type NrwLegendType,
} from '#views/CountryProfileNationalRiskWatch/types';

import i18n from './i18n.json';
import styles from './styles.module.css';

function formatBound(value: number): string {
    return formatNumber(value, { compact: true, maximumFractionDigits: 1 })
        ?? String(value);
}

function NrwLegendCategories(props: {
    item: Extract<NrwLegendItem, { type: NrwLegendType.Categories }>;
}) {
    const { item } = props;

    const strings = useTranslation(i18n);

    const getCategoryLabel = (category: NrwLegendCategory): string => {
        const { from, to } = category;

        if (isDefined(from) && isDefined(to)) {
            return resolveToString(strings.nrwLegendCategoriesRange, {
                from: formatBound(from),
                to: formatBound(to),
            });
        }
        if (isDefined(to)) {
            return resolveToString(strings.nrwLegendCategoriesBelow, { value: formatBound(to) });
        }
        if (isDefined(from)) {
            return resolveToString(strings.nrwLegendCategoriesAbove, { value: formatBound(from) });
        }
        return '';
    };

    return (
        <div className={styles.nrwLegendCategories}>
            <div className={styles.label}>
                {`${item.label}:`}
            </div>
            <div className={styles.categories}>
                {item.categories.map((category) => (
                    <div
                        key={category.color}
                        className={styles.category}
                    >
                        <div
                            className={styles.swatch}
                            style={{ backgroundColor: category.color }}
                        />
                        <span className={styles.categoryLabel}>
                            {getCategoryLabel(category)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default NrwLegendCategories;
