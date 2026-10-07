import { useState } from 'react';
import {
    faChevronDown,
    faChevronUp,
    faMap,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RawButton } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';

import {
    type NrwLegendItem,
    type NrwLegendType,
} from '#utils/nrw/legend';

import i18n from './i18n.json';
import styles from './styles.module.css';

function NrwLegendRamp(props: {
    item: Extract<NrwLegendItem, { type: NrwLegendType.Gradient }>;
}) {
    const { item } = props;

    const strings = useTranslation(i18n);

    return (
        <div className={styles.item}>
            <div className={styles.itemLabel}>
                {`${item.label}:`}
            </div>
            <div className={styles.ramp}>
                <span className={styles.rampLabel}>{strings.nrwMapLegendLow}</span>
                <div className={styles.rampSwatches}>
                    {item.colors.map((color) => (
                        <div
                            key={color}
                            className={styles.rampSwatch}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
                <span className={styles.rampLabel}>{strings.nrwMapLegendHigh}</span>
            </div>
        </div>
    );
}

function NrwMapLegend(props: {
    items: NrwLegendItem[];
}) {
    const { items } = props;

    const strings = useTranslation(i18n);
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className={styles.nrwMapLegend}>
            <RawButton
                name={undefined}
                className={styles.title}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
            >
                <span className={styles.titleLabel}>
                    <FontAwesomeIcon
                        icon={faMap}
                        className={styles.titleIcon}
                    />
                    {strings.nrwMapLegendTitle}
                </span>
                <FontAwesomeIcon
                    icon={isOpen ? faChevronDown : faChevronUp}
                    className={styles.titleIcon}
                />
            </RawButton>
            {isOpen && (
                <div className={styles.items}>
                    {items.map((item) => (
                        <NrwLegendRamp
                            key={item.layerName}
                            item={item}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default NrwMapLegend;
