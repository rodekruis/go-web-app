import { useState } from 'react';
import {
    CloseLineIcon,
    ErrorWarningLineIcon,
} from '@ifrc-go/icons';
import { Button } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';

import i18n from './i18n.json';
import styles from './styles.module.css';

function NrwEventNotFoundBanner() {
    const strings = useTranslation(i18n);
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) {
        return null;
    }

    return (
        <div
            className={styles.nrwEventNotFoundBanner}
            role="alert"
        >
            <div className={styles.content}>
                <span className={styles.message}>
                    <ErrorWarningLineIcon className={styles.infoIcon} />
                    {strings.nrwEventNotFoundMessage}
                </span>
                <Button
                    className={styles.closeButton}
                    name={undefined}
                    styleVariant="action"
                    onClick={() => setDismissed(true)}
                    title={strings.nrwEventNotFoundDismiss}
                >
                    <CloseLineIcon />
                </Button>
            </div>
        </div>
    );
}

export default NrwEventNotFoundBanner;
