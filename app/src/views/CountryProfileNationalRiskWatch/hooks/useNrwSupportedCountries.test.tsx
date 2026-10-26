import { renderHook } from '@testing-library/react';
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import { useNrwRequest } from '#utils/restRequest';

import useNrwSupportedCountries from './useNrwSupportedCountries';

vi.mock('#utils/restRequest', () => ({ useNrwRequest: vi.fn() }));

describe('useNrwSupportedCountries', () => {
    beforeEach(() => {
        vi.mocked(useNrwRequest).mockReset().mockReturnValue({
            response: [
                { countryCodeIso3: 'MWI' },
                { countryCodeIso3: 'ETH' },
            ],
            pending: false,
            error: undefined,
        } as unknown as ReturnType<typeof useNrwRequest>);
    });

    test('returns the supported country codes', () => {
        // Arrange
        const { result } = renderHook(() => useNrwSupportedCountries());

        // Act & Assert
        expect(result.current.supportedCountries).toEqual(['MWI', 'ETH']);
        expect(result.current.pending).toBe(false);
    });

    test('returns undefined while the request is pending', () => {
        // Arrange
        vi.mocked(useNrwRequest).mockReturnValue({
            response: undefined,
            pending: true,
            error: undefined,
        } as unknown as ReturnType<typeof useNrwRequest>);

        // Act
        const { result } = renderHook(() => useNrwSupportedCountries());

        // Assert
        expect(result.current.supportedCountries).toBeUndefined();
        expect(result.current.pending).toBe(true);
    });
});
