import { useState } from 'react';
import {
    faChevronDown,
    faChevronUp,
    faMap,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RawButton } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';

import { type NrwLegendItem } from '#views/CountryProfileNationalRiskWatch/types';

import NrwLegendRamp from './NrwLegendRamp';

import i18n from './i18n.json';
import styles from './styles.module.css';

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
