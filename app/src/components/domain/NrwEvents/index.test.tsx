import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import TestProviders from '#utils/testing/TestProviders';
import NrwEventsContext, { type NrwEventsContextProps } from '#views/CountryProfileNationalRiskWatch/contexts/NrwEventsContext';
import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

import NrwEvents from './index';

const events = [
    {
        eventId: 1,
        eventLabel: 'Tendaho',
        hazardType: 'floods',
        alertClass: 'high',
        eventStatus: 'ongoing',
        forecastSources: [],
        exposedAdminAreas: [],
    },
    {
        eventId: 2,
        eventLabel: 'Adaitu',
        hazardType: 'floods',
        alertClass: 'medium',
        eventStatus: 'ended',
        forecastSources: [],
        exposedAdminAreas: [],
    },
] as unknown as NrwEvent[];

function renderNrwEvents(selectedEvent: NrwEvent | undefined) {
    const onEventSelect = vi.fn();
    const contextValue: NrwEventsContextProps = {
        events,
        pending: false,
        errored: false,
        selectedEvent,
        eventNotFound: false,
        hoveredEventId: undefined,
        onEventSelect,
        onEventHoverChange: vi.fn(),
    };

    render(
        <NrwEventsContext.Provider value={contextValue}>
            <NrwEvents />
        </NrwEventsContext.Provider>,
        { wrapper: TestProviders },
    );

    return { onEventSelect };
}

describe('NrwEvents', () => {
    test('heads the full list with a plain title and opens an event from its card', () => {
        // Arrange
        const { onEventSelect } = renderNrwEvents(undefined);

        // Act
        fireEvent.click(screen.getByRole('button', { name: /Tendaho/ }));

        // Assert
        expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(/^Events\s*2$/);
        expect(screen.queryByRole('button', { name: /all events/i })).toBeNull();
        expect(onEventSelect).toHaveBeenCalledWith(1, expect.anything());
    });

    test('keeps the status info button of an ended event separate from its card button', () => {
        // Arrange
        const { onEventSelect } = renderNrwEvents(undefined);
        const buttons = screen.getAllByRole('button');
        const cardButtons = [
            screen.getByRole('button', { name: /Tendaho/ }),
            screen.getByRole('button', { name: /Adaitu/ }),
        ];
        const infoButton = buttons.find((button) => !cardButtons.includes(button));

        // Act
        fireEvent.click(infoButton as HTMLElement);

        // Assert
        expect(buttons).toHaveLength(3);
        expect(buttons.some((button) => button.querySelector('button'))).toBe(false);
        expect(onEventSelect).not.toHaveBeenCalled();
    });

    test('heads the selected event with the only button, which goes back to all events', () => {
        // Arrange
        const { onEventSelect } = renderNrwEvents(events[0]);
        const backButton = screen.getByRole('button', { name: /all events/i });

        // Act
        fireEvent.click(backButton);

        // Assert
        expect(backButton).toHaveTextContent(/^All events\s*2$/);
        expect(screen.getAllByRole('button')).toEqual([backButton]);
        expect(onEventSelect).toHaveBeenCalledWith(undefined);
    });
});
