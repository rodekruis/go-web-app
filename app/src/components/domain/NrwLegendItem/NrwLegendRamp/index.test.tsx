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
import {
    type NrwLegendItem,
    NrwLegendType,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwLegendRamp from './index';

import i18n from './i18n.json';

describe('NrwLegendRamp', () => {
    test('shows custom endpoint labels and preserves the colour swatches', () => {
        // Arrange
        const colors = ['#cbddf2', '#9ebadc', '#6e96c5', '#467abc', '#3163a0'];
        const item: Extract<NrwLegendItem, { type: NrwLegendType.Gradient }> = {
            type: NrwLegendType.Gradient,
            layerName: 'floodDepth',
            label: 'Flood depth',
            colors,
            lowLabel: '<0.25 m',
            highLabel: '>2.5 m',
        };

        // Act
        render(<NrwLegendRamp item={item} />, { wrapper: TestProviders });

        // Assert
        const lowLabel = screen.getByText('<0.25 m');
        const highLabel = screen.getByText('>2.5 m');
        const swatches = lowLabel.nextElementSibling;
        expect(swatches?.nextElementSibling).toBe(highLabel);
        expect(swatches?.children).toHaveLength(colors.length);
        colors.forEach((color, index) => {
            expect(swatches?.children[index]).toHaveStyle({ backgroundColor: color });
        });
        expect(screen.queryByText(i18n.strings.nrwLegendRampLow)).not.toBeInTheDocument();
        expect(screen.queryByText(i18n.strings.nrwLegendRampHigh)).not.toBeInTheDocument();
    });

    test('keeps the translated low and high labels for ramps without endpoint labels', () => {
        // Arrange
        const item: Extract<NrwLegendItem, { type: NrwLegendType.Gradient }> = {
            type: NrwLegendType.Gradient,
            layerName: 'populationDensity',
            label: 'Population density',
            colors: ['#cccccc', '#333333'],
        };

        // Act
        render(<NrwLegendRamp item={item} />, { wrapper: TestProviders });

        // Assert
        screen.getByText(i18n.strings.nrwLegendRampLow);
        screen.getByText(i18n.strings.nrwLegendRampHigh);
    });
});
