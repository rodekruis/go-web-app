import {
    act,
    renderHook,
} from '@testing-library/react';
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import { useNrwRequest } from '#utils/restRequest';

import {
    type CountryCodeIso3,
    type NrwEvent,
} from '../types';
import useNrwEvents from './useNrwEvents';

vi.mock('#utils/restRequest', () => ({ useNrwRequest: vi.fn() }));

const floodEvent = { eventId: 9, hazardType: 'floods' } as NrwEvent;
const droughtEvent = { eventId: 11, hazardType: 'drought' } as NrwEvent;

function renderNrwEvents() {
    const onSelectedEventIdChange = vi.fn();

    const { result } = renderHook(() => useNrwEvents({
        countries: ['ETH' as CountryCodeIso3],
        selectedEventId: undefined,
        onSelectedEventIdChange,
    }));

    return { result, onSelectedEventIdChange };
}

describe('useNrwEvents', () => {
    beforeEach(() => {
        vi.mocked(useNrwRequest).mockReset().mockReturnValue({
            response: [floodEvent, droughtEvent],
            pending: false,
            error: undefined,
        } as unknown as ReturnType<typeof useNrwRequest>);
    });

    test('reports the hazard type of the selected event', () => {
        // Arrange
        const { result, onSelectedEventIdChange } = renderNrwEvents();

        // Act
        act(() => {
            result.current.onEventSelect(9);
        });

        // Assert
        expect(onSelectedEventIdChange.mock.calls).toEqual([[9, 'floods']]);
    });

    test('reports no event and no hazard type when the event is cleared', () => {
        // Arrange
        const { result, onSelectedEventIdChange } = renderNrwEvents();

        // Act
        act(() => {
            result.current.onEventSelect(undefined);
        });

        // Assert
        expect(onSelectedEventIdChange.mock.calls).toEqual([[undefined, undefined]]);
    });

    test('reports no hazard type when the event is unknown', () => {
        // Arrange
        const { result, onSelectedEventIdChange } = renderNrwEvents();

        // Act
        act(() => {
            result.current.onEventSelect(42);
        });

        // Assert
        expect(onSelectedEventIdChange.mock.calls).toEqual([[42, undefined]]);
    });
});
