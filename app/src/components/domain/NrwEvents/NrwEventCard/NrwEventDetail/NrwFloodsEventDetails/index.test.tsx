import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import TestProviders from '#utils/testing/TestProviders';
import { type NrwFloodsDetails } from '#views/CountryProfileNationalRiskWatch/types';

import NrwFloodsEventDetails from './index';

const medians = [955, 1102, 1245, 1245, 1413, 1413, 1413, 1245];

function createFloodsDetails(
    alertDetails: Partial<NrwFloodsDetails['alertDetails']> = {},
): NrwFloodsDetails {
    return {
        stationCode: 'G1045',
        stationName: 'Tendaho',
        alertDetails: {
            current: 955,
            peakDay: '2026-10-30T09:00:00.000Z',
            peakValue: 1413,
            probabilityOfExceedance: 0.9,
            returnPeriod: 5,
            timeSeries: medians.map((median, index) => ({
                start: new Date(Date.UTC(2026, 9, 26 + index, 9)).toISOString(),
                end: new Date(Date.UTC(2026, 9, 27 + index, 9)).toISOString(),
                median,
                low: median * 0.95,
                high: median * 1.05,
            })),
            ...alertDetails,
        },
        returnPeriodThresholds: [
            { returnPeriod: 2, thresholdValue: 1143, severityClass: 'low' },
            { returnPeriod: 5, thresholdValue: 1346, severityClass: 'medium' },
            { returnPeriod: 10, thresholdValue: 1481, severityClass: 'high' },
        ],
    };
}

function renderForecast(
    floodsDetails: NrwFloodsDetails,
    startAt = '2026-10-28T09:00:00.000Z',
) {
    render(
        <NrwFloodsEventDetails
            floodsDetails={floodsDetails}
            alertClass="medium"
            startAt={startAt}
        />,
        { wrapper: TestProviders },
    );

    return screen.getByRole('button', { name: /River discharge forecast/ });
}

describe('NrwFloodsEventDetails', () => {
    // The forecast below is issued on 26 Oct, the day of the first entry.
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 9, 26, 12));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('summarizes the return period and shows the forecast when expanded', () => {
        // Arrange
        const toggle = renderForecast(createFloodsDetails());

        // Assert: collapsed
        expect(toggle).toHaveTextContent('River discharge forecast:5 year return period');
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('img', { name: 'River discharge forecast chart' })).toBeNull();

        // Act
        fireEvent.click(toggle);

        // Assert: expanded
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('G1045 - Tendaho')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'River discharge forecast chart' })).toBeInTheDocument();
        expect(screen.getByText('Start')).toBeInTheDocument();
        expect(screen.getByText('Medium threshold')).toBeInTheDocument();
        expect(screen.getByText('28.10')).toBeInTheDocument();
        expect(screen.getByText('90% probability of exceeding the 5 year return period')).toBeInTheDocument();
    });

    test('names the highest severity threshold reached in the probability, not the return period', () => {
        // Arrange: the peak reaches a 20 year return period beyond the severity thresholds
        const floodsDetails = createFloodsDetails({ returnPeriod: 20, peakValue: 1700 });
        floodsDetails.returnPeriodThresholds.push(
            { returnPeriod: 20, thresholdValue: 1600, severityClass: null },
        );

        // Act
        fireEvent.click(renderForecast(floodsDetails));

        // Assert
        expect(screen.getByText('90% probability of exceeding the 10 year return period')).toBeInTheDocument();
    });

    test('marks a single threshold without an alert class', () => {
        // Arrange
        const floodsDetails = createFloodsDetails();
        floodsDetails.returnPeriodThresholds = [
            { returnPeriod: 5, thresholdValue: 1346, severityClass: 'singleThreshold' },
        ];

        // Act
        fireEvent.click(renderForecast(floodsDetails));

        // Assert
        expect(screen.getByText('Threshold reached')).toBeInTheDocument();
    });

    test('only marks the threshold reached when the event starts on that day', () => {
        // Arrange: the median reaches the 5 year threshold on 30 Oct
        const toggle = renderForecast(createFloodsDetails(), '2026-10-30T12:00:00.000Z');

        // Act
        fireEvent.click(toggle);

        // Assert
        expect(screen.getByText('Medium threshold')).toBeInTheDocument();
        expect(screen.queryByText('Start')).toBeNull();
    });

    test('does not mark a start on the first forecast day', () => {
        // Act: the event started when the forecast was issued
        fireEvent.click(renderForecast(createFloodsDetails(), '2026-10-26T12:00:00.000Z'));

        // Assert
        expect(screen.queryByText('Start')).toBeNull();
        expect(screen.getByText('Medium threshold')).toBeInTheDocument();
    });

    test('keeps marking moments that passed since the forecast was issued', () => {
        // Arrange: 2 days after the threshold is reached on 30 Oct
        vi.setSystemTime(new Date(2026, 10, 1, 12));

        // Act
        fireEvent.click(renderForecast(createFloodsDetails()));

        // Assert
        expect(screen.getByText('Start')).toBeInTheDocument();
        expect(screen.getByText('Medium threshold')).toBeInTheDocument();
    });

    test('leaves out the markers of an event that started before the forecast', () => {
        // Arrange: the median is above the thresholds from the first day
        const toggle = renderForecast(
            createFloodsDetails({
                timeSeries: createFloodsDetails().alertDetails.timeSeries
                    .map((entry) => ({ ...entry, median: 1413 })),
            }),
            '2026-10-20T09:00:00.000Z',
        );

        // Act
        fireEvent.click(toggle);

        // Assert
        expect(screen.queryByText('Start')).toBeNull();
        expect(screen.queryByText('Medium threshold')).toBeNull();
    });

    test('leaves out the return period and probability when there are none', () => {
        // Arrange
        const toggle = renderForecast(createFloodsDetails({
            returnPeriod: null,
            probabilityOfExceedance: null,
        }));

        // Act
        fireEvent.click(toggle);

        // Assert
        expect(toggle).toHaveTextContent('Below return period thresholds');
        expect(screen.queryByText(/probability/)).toBeNull();
    });
});
