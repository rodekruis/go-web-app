import {
    render,
    screen,
} from '@testing-library/react';
import {
    describe,
    expect,
    test,
} from 'vitest';

import TestProviders from '#utils/testing/TestProviders';

import NrwInvalidCountryError from './index';

import i18n from './i18n.json';

describe('NrwInvalidCountryError', () => {
    test('shows the title and description', () => {
        // Act
        render(<NrwInvalidCountryError />, { wrapper: TestProviders });

        // Assert
        screen.getByText(i18n.strings.nrwInvalidCountryTitle);
        screen.getByText(i18n.strings.nrwInvalidCountryDescription);
    });

    test('has the alert role', () => {
        // Act
        render(<NrwInvalidCountryError />, { wrapper: TestProviders });

        // Assert
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });
});
