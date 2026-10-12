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
    type NrwLegendBanner as NrwLegendBannerType,
    NrwLegendBannerState,
    NrwLegendType,
} from '#views/CountryProfileNationalRiskWatch/types';

import { NrwLegendBannerContent } from './index';

import rampI18n from '../NrwMap/NrwMapLegend/NrwLegendRamp/i18n.json';
import i18n from './i18n.json';

function renderBanner(banner: NrwLegendBannerType) {
    return render(
        <NrwLegendBannerContent banner={banner} />,
        { wrapper: TestProviders },
    );
}

describe('NrwLegendBannerContent', () => {
    test('shows the visible exposure layers of the event', () => {
        const { container } = renderBanner({
            state: NrwLegendBannerState.Event,
            items: [
                {
                    type: NrwLegendType.Gradient,
                    layerName: 'floodDepth',
                    label: 'Flood depth',
                    colors: ['#cbddf2', '#3163a0'],
                },
                {
                    type: NrwLegendType.Classes,
                    layerName: 'exposedPopulation',
                    label: 'Exposed population',
                    classes: [
                        { color: '#fef1f2', from: undefined, to: 100 },
                        { color: '#fa999f', from: 100, to: 2500 },
                        { color: '#c01825', from: 2500, to: undefined },
                    ],
                },
            ],
        });

        expect(screen.getByText('Flood depth:')).toBeInTheDocument();
        expect(screen.getByText(rampI18n.strings.nrwLegendRampLow)).toBeInTheDocument();
        expect(screen.getByText('Exposed population:')).toBeInTheDocument();
        expect(screen.getByText('<100')).toBeInTheDocument();
        expect(screen.getByText('100-2.5K')).toBeInTheDocument();
        expect(screen.getByText('2.5K+')).toBeInTheDocument();
        expect(container.querySelectorAll('[style*="background-color"]')).toHaveLength(5);
    });

    test('renders nothing for an event without legend items', () => {
        const { container } = renderBanner({ state: NrwLegendBannerState.Event, items: [] });

        expect(container).toBeEmptyDOMElement();
    });

    test('shows the alert levels and event types of the markers', () => {
        renderBanner({ state: NrwLegendBannerState.Countries });

        expect(screen.getByText(i18n.strings.nrwLegendBannerAlertLevelLabel)).toBeInTheDocument();
        expect(screen.getByText(i18n.strings.nrwLegendBannerAlertLow)).toBeInTheDocument();
        expect(screen.getByText(i18n.strings.nrwLegendBannerAlertHigh)).toBeInTheDocument();
        expect(screen.getByText(i18n.strings.nrwLegendBannerEventTypeLabel)).toBeInTheDocument();
        expect(screen.getByText(i18n.strings.nrwLegendBannerHazardCyclone)).toBeInTheDocument();
    });

    test('asks to turn on layers', () => {
        renderBanner({ state: NrwLegendBannerState.NoLayers });

        expect(screen.getByText(i18n.strings.nrwLegendBannerNoLayersMessage)).toBeInTheDocument();
    });
});
