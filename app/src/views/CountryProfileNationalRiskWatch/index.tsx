import { useTranslation } from '@ifrc-go/ui/hooks';
import { _cs } from '@togglecorp/fujs';

import useIsChromeless from '#hooks/useIsChromeless';

import NrwMap from './NrwMap';

import i18n from './i18n.json';
import styles from './styles.module.css';

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const strings = useTranslation(i18n);
    const isChromeless = useIsChromeless();

    return (
        <div>
            <div
                className={styles.nationalRiskWatchHeading}
            >
                {strings.nationalRiskWatchHeading}
            </div>
            <div
                className={_cs(
                    styles.container,
                    isChromeless && styles.chromeless,
                )}
            >
                <div className={styles.mainContent}>
                    <div className={styles.eventPanelColumn}>
                        <div />
                    </div>
                    <div className={styles.mapColumn}>
                        <NrwMap />
                    </div>
                </div>
            </div>

        </div>
    );
}

Component.displayName = 'CountryProfileNationalRiskWatch';
