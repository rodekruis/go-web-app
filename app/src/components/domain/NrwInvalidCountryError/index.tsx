import { faGlobe } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from '@ifrc-go/ui/hooks';

import i18n from './i18n.json';
import styles from './styles.module.css';

function NrwInvalidCountryError() {
    const strings = useTranslation(i18n);

    return (
        <div
            className={styles.nrwInvalidCountryError}
            role="alert"
        >
            <div className={styles.iconCircle}>
                <FontAwesomeIcon
                    icon={faGlobe}
                    className={styles.icon}
                />
            </div>
            <div className={styles.title}>
                {strings.nrwInvalidCountryTitle}
            </div>
            <div className={styles.description}>
                {strings.nrwInvalidCountryDescription}
            </div>
        </div>
    );
}

export default NrwInvalidCountryError;
