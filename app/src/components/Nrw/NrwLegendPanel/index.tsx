import { type EventResponseDto } from '#utils/nrw/shared-dtos';

interface NrwLegendPanelProps {
    selectedEvent: EventResponseDto | null;
}

/**
 * Legend panel for the displayed layer and event info
 */
export default function NrwLegendPanel({
    selectedEvent,
}: NrwLegendPanelProps) {
    if (!selectedEvent) {
        return (<div />);
    }

    return (
        <div />
    );
}
