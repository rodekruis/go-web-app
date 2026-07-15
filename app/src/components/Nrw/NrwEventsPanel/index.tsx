/* eslint-disable @typescript-eslint/no-unused-vars */
import { type AdminAreaDetails } from '#utils/nrw/nrwDataFetchHelpers';
import { type EventResponseDto } from '#utils/nrw/shared-dtos';

interface NrwEventsPanelProps {
  eventData: EventResponseDto[];
  activeEventId: number | null;
  onEventClick: (eventId: number) => void;
  onRefreshAll: () => void;
  onDeselectEvent: () => void;
    countryCodes: string[];
  selectedAdminPlaceCode: string | null;
  adminDetails: AdminAreaDetails | null;
}

/**
 * Control panel showing upcoming events for the scoped country.
 * Each event displays affected admin1 areas and total population.
 */
export default function NrwEventsPanel({
    eventData,
    activeEventId,
    onEventClick,
    onRefreshAll,
    onDeselectEvent,
    countryCodes,
    selectedAdminPlaceCode,
    adminDetails,
}: NrwEventsPanelProps) {
    // Get data for the selected event
    const selectedEvent = eventData.find((event) => event.eventId === activeEventId) ?? null;

    const handleBack = () => {
        onDeselectEvent();
    };

    return (
        <div />
    );
}
