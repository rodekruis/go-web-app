import {
    render,
    screen,
} from '@testing-library/react';
import {
    describe,
    expect,
    test,
} from 'vitest';

import rampI18n from '#components/domain/NrwLegendItem/NrwLegendRamp/i18n.json';
import TestProviders from '#utils/testing/TestProviders';
import {
    type NrwLegend,
    NrwLegendState,
    NrwLegendType,
} from '#views/CountryProfileNationalRiskWatch/types';

import { NrwLegendBannerContent } from '../index';

import markerI18n from '../NrwMarkerLegend/i18n.json';
import i18n from '../i18n.json';

function renderBanner(legend: NrwLegend) {
    return render(
        <NrwLegendBannerContent legend={legend} />,
        { wrapper: TestProviders },
    );
}

describe('NrwLegendBannerContent', () => {
    test('shows the visible exposure layers of the event', () => {
        // Act
        const { container } = renderBanner({
            state: NrwLegendState.Items,
            items: [
                {
                    type: NrwLegendType.Gradient,
                    layerName: 'floodDepth',
                    label: 'Flood depth',
                    colors: ['#cbddf2', '#3163a0'],
                },
                {
                    type: NrwLegendType.Categories,
                    layerName: 'exposedPopulation',
                    label: 'Exposed population',
                    categories: [
                        { color: '#fef1f2', from: undefined, to: 100 },
                        { color: '#fa999f', from: 100, to: 2500 },
                        { color: '#c01825', from: 2500, to: undefined },
                    ],
                },
            ],
        });

        // Assert
        expect(screen.getByText('Flood depth:')).toBeInTheDocument();
        expect(screen.getByText(rampI18n.strings.nrwLegendRampLow)).toBeInTheDocument();
        expect(screen.getByText('Exposed population:')).toBeInTheDocument();
        expect(screen.getByText('<100')).toBeInTheDocument();
        expect(screen.getByText('100-2.5K')).toBeInTheDocument();
        expect(screen.getByText('2.5K+')).toBeInTheDocument();
        expect(container.querySelectorAll('[style*="background-color"]')).toHaveLength(5);
    });

    test('keeps the strip, empty, for an event whose legend items are not ready', () => {
        // Act
        const { container } = renderBanner({ state: NrwLegendState.Items, items: [] });

        // Assert
        expect(container.firstChild).toBeEmptyDOMElement();
    });

    test('shows the alert levels and event types of the markers', () => {
        // Act
        renderBanner({ state: NrwLegendState.NoEvent });

        // Assert
        const { strings } = markerI18n;
        expect(screen.getByText(strings.nrwMarkerLegendAlertLevelLabel)).toBeInTheDocument();
        expect(screen.getByText(strings.nrwMarkerLegendAlertLow)).toBeInTheDocument();
        expect(screen.getByText(strings.nrwMarkerLegendAlertHigh)).toBeInTheDocument();
        expect(screen.getByText(strings.nrwMarkerLegendEventTypeLabel)).toBeInTheDocument();
        expect(screen.getByText(strings.nrwMarkerLegendHazardCyclone)).toBeInTheDocument();
    });

    test('asks to turn on layers', () => {
        // Act
        renderBanner({ state: NrwLegendState.NoLayers });

        // Assert
        expect(screen.getByText(i18n.strings.nrwLegendBannerNoLayersMessage)).toBeInTheDocument();
    });
});
