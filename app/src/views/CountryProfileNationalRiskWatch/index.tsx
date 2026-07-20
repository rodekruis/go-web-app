import { useTranslation } from '@ifrc-go/ui/hooks';

import NrwMapContainer from '#components/Nrw';

import i18n from './i18n.json';
import styles from './styles.module.css';

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const strings = useTranslation(i18n);

    return (
        <div>
            <div
                className={styles.nationalRiskWatchHeading}
            >
                {strings.nationalRiskWatchHeading}
            </div>
            <NrwMapContainer />
        </div>
    );
}

Component.displayName = 'CountryProfileNationalRiskWatch';
