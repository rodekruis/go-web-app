import { type EventResponseDto } from '#utils/nrw/shared-dtos';

interface NrwLegendPanelProps {
    selectedEvent: EventResponseDto | null;
}

/**
 * Legend panel shown under the map.
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
