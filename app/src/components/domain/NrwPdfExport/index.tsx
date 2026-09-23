import {
    type RefObject,
    useCallback,
    useContext,
    useState,
} from 'react';
import { faDownload } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { isNotDefined } from '@togglecorp/fujs';

import NrwMapContext from '#components/domain/NrwMap/NrwMapContext';
import useAlert from '#hooks/useAlert';
import NrwEventsContext from '#views/CountryProfileNationalRiskWatch/contexts/NrwEventsContext';

import exportNrwToPdf from './exportNrwToPdf';

import i18n from './i18n.json';
import styles from './styles.module.css';

interface Props {
    eventsPanelRef: RefObject<HTMLDivElement | null>;
}

// Needs NrwMapContext, which the NRW view provides; disabled until the map has loaded.
function NrwPdfExport(props: Props) {
    const { eventsPanelRef } = props;

    const strings = useTranslation(i18n);
    const { map } = useContext(NrwMapContext);
    const { selectedEvent } = useContext(NrwEventsContext);
    const alert = useAlert();
    const [exporting, setExporting] = useState(false);

    const handleClick = useCallback(async () => {
        if (isNotDefined(map)) {
            return;
        }
        setExporting(true);
        try {
            await exportNrwToPdf(map, eventsPanelRef.current, selectedEvent);
        } catch (error) {
            alert.show(strings.nrwPdfExportFailedMessage, {
                variant: 'danger',
                debugMessage: error instanceof Error ? error.message : String(error),
            });
        } finally {
            setExporting(false);
        }
    }, [map, eventsPanelRef, selectedEvent, alert, strings]);

    return (
        <button
            type="button"
            className={styles.exportButton}
            disabled={isNotDefined(map) || exporting}
            onClick={handleClick}
        >
            <FontAwesomeIcon icon={faDownload} className={styles.icon} />
            {exporting
                ? strings.nrwPdfExportExportingLabel
                : strings.nrwPdfExportButtonLabel}
        </button>
    );
}

export default NrwPdfExport;
