import {
    type RefObject,
    useCallback,
    useContext,
    useState,
} from 'react';
import { faDownToLine } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import {
    formatDate,
    resolveToString,
} from '@ifrc-go/ui/utils';
import { isNotDefined } from '@togglecorp/fujs';

import NrwMapContext from '#components/domain/NrwMap/NrwMapContext';
import useAlert from '#hooks/useAlert';
import NrwEventsContext from '#views/CountryProfileNationalRiskWatch/contexts/NrwEventsContext';
import { type CountryCodeIso3 } from '#views/CountryProfileNationalRiskWatch/types';

import exportNrwToPdf from './exportNrwToPdf';

import i18n from './i18n.json';

const dataFormat = 'dd MMM yyyy, hh:mm';

interface Props {
    eventsPanelRef: RefObject<HTMLDivElement | null>;
    countries: CountryCodeIso3[];
}

function NrwPdfExport(props: Props) {
    const { eventsPanelRef, countries } = props;

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
            await exportNrwToPdf(map, eventsPanelRef.current, selectedEvent, countries, {
                title: strings.nrwPdfExportTitle,
                generated: resolveToString(strings.nrwPdfExportGenerated, {
                    date: formatDate(new Date(), dataFormat) ?? '',
                }),
                mapNote: strings.nrwPdfExportMapNote,
                // For now, the export is always a single page.
                // This will change when we support longer data lists.
                pageLabel: resolveToString(strings.nrwPdfExportPageLabel, { page: 1, total: 1 }),
            });
        } catch (error) {
            alert.show(strings.nrwPdfExportFailedMessage, {
                variant: 'danger',
                debugMessage: error instanceof Error ? error.message : String(error),
            });
        } finally {
            setExporting(false);
        }
    }, [map, eventsPanelRef, selectedEvent, countries, alert, strings]);

    return (
        <Button
            name={undefined}
            spacing="xl"
            styleVariant="outline"
            colorVariant="secondary"
            disabled={isNotDefined(map) || exporting}
            onClick={handleClick}
            before={<FontAwesomeIcon icon={faDownToLine} />}
        >
            {exporting
                ? strings.nrwPdfExportExportingLabel
                : strings.nrwPdfExportButtonLabel}
        </Button>
    );
}

export default NrwPdfExport;
