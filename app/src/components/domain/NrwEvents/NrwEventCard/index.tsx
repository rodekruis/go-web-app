import { Container } from '@ifrc-go/ui';

import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

import NrwEventChips, { type NrwEventChipsEvent } from '../NrwEventChips';
import NrwEventName, { type NrwEventNameEvent } from '../NrwEventName';

type NrwEventCardEvent =
    & Pick<NrwEvent, 'eventId'>
    & NrwEventChipsEvent
    & NrwEventNameEvent;

interface Props {
    className?: string;
    event: NrwEventCardEvent;
}

function NrwEventCard(props: Props) {
    const { className, event } = props;

    return (
        <Container className={className} withContentWell>
            <NrwEventChips event={event} />
            <NrwEventName event={event} />
        </Container>
    );
}

export default NrwEventCard;
