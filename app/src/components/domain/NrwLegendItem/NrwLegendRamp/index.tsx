import { useTranslation } from '@ifrc-go/ui/hooks';

import {
    type NrwLegendItem,
    type NrwLegendType,
} from '#views/CountryProfileNationalRiskWatch/types';

import i18n from './i18n.json';
import styles from './styles.module.css';

function NrwLegendRamp(props: {
    item: Extract<NrwLegendItem, { type: NrwLegendType.Gradient }>;
}) {
    const { item } = props;

    const strings = useTranslation(i18n);

    return (
        <div className={styles.nrwLegendRamp}>
            <div className={styles.label}>
                {`${item.label}:`}
            </div>
            <div className={styles.ramp}>
                <span className={styles.rampLabel}>{strings.nrwLegendRampLow}</span>
                <div className={styles.rampSwatches}>
                    {item.colors.map((color) => (
                        <div
                            key={color}
                            className={styles.rampSwatch}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
                <span className={styles.rampLabel}>{strings.nrwLegendRampHigh}</span>
            </div>
        </div>
    );
}

export default NrwLegendRamp;
