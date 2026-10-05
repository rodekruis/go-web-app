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
        const { result, onSelectedEventIdChange } = renderNrwEvents();

        act(() => {
            result.current.onEventSelect(9);
        });
        act(() => {
            result.current.onEventSelect(11);
        });

        expect(onSelectedEventIdChange.mock.calls).toEqual([[9, 'floods'], [11, 'drought']]);
    });

    test('reports no hazard type when the event is cleared or unknown', () => {
        const { result, onSelectedEventIdChange } = renderNrwEvents();

        act(() => {
            result.current.onEventSelect(undefined);
        });
        act(() => {
            result.current.onEventSelect(42);
        });

        expect(onSelectedEventIdChange.mock.calls)
            .toEqual([[undefined, undefined], [42, undefined]]);
    });
});
