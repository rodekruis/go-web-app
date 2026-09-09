import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Heading } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import {
    formatDate,
    resolveToString,
} from '@ifrc-go/ui/utils';
import { _cs } from '@togglecorp/fujs';

import hazardIcons from '#utils/nrw/hazardIcons';
import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

import i18n from './i18n.json';
import styles from './styles.module.css';

const eventDateFormat = 'dd MMM yyyy';

// Pick NrwEvent props used in the NrwEventName component
export type NrwEventNameEvent = Pick<NrwEvent, 'eventLabel' | 'hazardType' | 'startAt'>;

interface Props {
    className?: string;
    event: NrwEventNameEvent;
}

function NrwEventName(props: Props) {
    const { className, event } = props;

    const strings = useTranslation(i18n);

    const hazardLabels: Record<NrwEvent['hazardType'], string> = {
        floods: strings.nrwEventNameHazardFloods,
        drought: strings.nrwEventNameHazardDrought,
        tropicalCyclone: strings.nrwEventNameHazardTropicalCyclone,
    };

    const name = resolveToString(
        strings.nrwEventName,
        {
            hazard: hazardLabels[event.hazardType],
            label: event.eventLabel,
            date: formatDate(event.startAt, eventDateFormat) ?? '',
        },
    );

    const hazardIcon = hazardIcons[event.hazardType];

    return (
        <div className={_cs(styles.nrwEventName, className)}>
            <FontAwesomeIcon className={styles.hazardIcon} icon={hazardIcon} />
            <Heading className={styles.heading} level={5}>{name}</Heading>
        </div>
    );
}

export default NrwEventName;
