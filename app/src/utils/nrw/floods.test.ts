import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    type NrwFloodsDetails,
    type NrwReturnPeriodThreshold,
    type NrwSeverityThreshold,
} from '#views/CountryProfileNationalRiskWatch/types';

import {
    formatNrwDischarge,
    getNrwForecastMarkers,
    getNrwReachedSeverityThreshold,
    getNrwThresholdAlertClass,
    getNrwThresholdReachedIndex,
    getNrwTimeSeriesIndex,
} from './floods';

function createThreshold(
    returnPeriod: number,
    thresholdValue: number,
    severityClass: NrwReturnPeriodThreshold['severityClass'],
): NrwReturnPeriodThreshold {
    return { returnPeriod, thresholdValue, severityClass };
}

function createAlertDetails(
    medians: number[],
    peakDay: string,
): NrwFloodsDetails['alertDetails'] {
    return {
        current: medians.at(0) ?? 0,
        peakDay,
        peakValue: Math.max(...medians),
        probabilityOfExceedance: 0.9,
        returnPeriod: 5,
        timeSeries: medians.map((median, index) => ({
            start: `2026-10-2${index}T09:00:00.000Z`,
            end: `2026-10-2${index + 1}T09:00:00.000Z`,
            median,
            low: median * 0.9,
            high: median * 1.1,
        })),
    };
}

function createFloodsDetails(
    peakValue: number,
    returnPeriodThresholds: NrwReturnPeriodThreshold[],
): NrwFloodsDetails {
    return {
        stationCode: 'G1045',
        stationName: 'Tendaho',
        alertDetails: { ...createAlertDetails([peakValue], ''), peakValue },
        returnPeriodThresholds,
    };
}

describe('getNrwReachedSeverityThreshold', () => {
    const thresholds = [
        createThreshold(2, 1143, 'low'),
        createThreshold(5, 1346, 'medium'),
        createThreshold(10, 1481, 'high'),
    ];

    test('is the highest severity threshold that the peak reaches', () => {
        expect(getNrwReachedSeverityThreshold(createFloodsDetails(1413, thresholds)))
            .toEqual(thresholds[1]);
    });

    test('includes a threshold that the peak reaches exactly', () => {
        expect(getNrwReachedSeverityThreshold(createFloodsDetails(1481, thresholds)))
            .toEqual(thresholds[2]);
    });

    test('skips thresholds without severity class', () => {
        // Arrange
        const withExtraThreshold = [...thresholds, createThreshold(20, 1600, null)];

        // Act & Assert
        expect(getNrwReachedSeverityThreshold(createFloodsDetails(1700, withExtraThreshold)))
            .toEqual(thresholds[2]);
    });

    test('is undefined when the peak stays below every threshold', () => {
        expect(getNrwReachedSeverityThreshold(createFloodsDetails(1000, thresholds)))
            .toBeUndefined();
    });

    test('does not depend on the order of the thresholds', () => {
        expect(getNrwReachedSeverityThreshold(
            createFloodsDetails(1500, [...thresholds].reverse()),
        )).toEqual(thresholds[2]);
    });

    test('is the lowest single threshold, as higher ones are only reached return periods', () => {
        // Arrange: the API classifies all reached return periods above a single threshold
        const singleThresholds = [
            createThreshold(10, 9559, 'singleThreshold'),
            createThreshold(5, 8417, 'singleThreshold'),
            createThreshold(20, 10655, 'singleThreshold'),
        ];

        // Act & Assert
        expect(getNrwReachedSeverityThreshold(createFloodsDetails(11364, singleThresholds)))
            .toEqual(singleThresholds[1]);
    });

    test('is undefined when the peak stays below a single threshold', () => {
        expect(getNrwReachedSeverityThreshold(createFloodsDetails(
            8000,
            [createThreshold(5, 8417, 'singleThreshold')],
        ))).toBeUndefined();
    });

    test('is the configured level, not a higher return period with the same class', () => {
        // Arrange: the API classifies the reached 10 year return period as 'high' too
        const levels = [
            createThreshold(1.5, 64, 'low'),
            createThreshold(2, 74, 'medium'),
            createThreshold(5, 99, 'high'),
            createThreshold(10, 116, 'high'),
        ];

        // Act & Assert
        expect(getNrwReachedSeverityThreshold(createFloodsDetails(124, levels)))
            .toEqual(levels[2]);
    });
});

describe('getNrwTimeSeriesIndex', () => {
    const { timeSeries } = createAlertDetails([955, 1102, 1413], '');

    test('is the day that contains the date', () => {
        expect(getNrwTimeSeriesIndex(timeSeries, '2026-10-21T21:00:00.000Z')).toBe(1);
    });

    test('includes the start of a day', () => {
        expect(getNrwTimeSeriesIndex(timeSeries, '2026-10-22T09:00:00.000Z')).toBe(2);
    });

    test('is undefined for a date before or after the time series', () => {
        expect(getNrwTimeSeriesIndex(timeSeries, '2026-10-19T09:00:00.000Z')).toBeUndefined();
        expect(getNrwTimeSeriesIndex(timeSeries, '2026-10-23T09:00:00.000Z')).toBeUndefined();
    });

    test('includes the last second of a UTC day that ends at 23:59:59', () => {
        // Arrange: forecast days as the pipeline delivers them
        const utcDays = [20, 21].map((day) => ({
            start: `2026-10-${day}T00:00:00Z`,
            end: `2026-10-${day}T23:59:59Z`,
            median: 1000,
            low: 900,
            high: 1100,
        }));

        // Act & Assert
        expect(getNrwTimeSeriesIndex(utcDays, '2026-10-20T23:59:59.500Z')).toBe(0);
    });
});

describe('getNrwThresholdReachedIndex', () => {
    const { timeSeries } = createAlertDetails([1000, 1200, 1400, 1300], '');

    test('is the first day on which the median reaches the value', () => {
        expect(getNrwThresholdReachedIndex(timeSeries, 1300)).toBe(2);
        expect(getNrwThresholdReachedIndex(timeSeries, 1200)).toBe(1);
    });

    test('includes the first day', () => {
        expect(getNrwThresholdReachedIndex(timeSeries, 1000)).toBe(0);
    });

    test('is undefined when the median never reaches the value', () => {
        expect(getNrwThresholdReachedIndex(timeSeries, 1500)).toBeUndefined();
    });
});

describe('getNrwForecastMarkers', () => {
    const { timeSeries } = createAlertDetails([1000, 1200, 1400, 1300], '');
    const mediumThreshold: NrwSeverityThreshold = {
        returnPeriod: 5,
        thresholdValue: 1300,
        severityClass: 'medium',
    };
    const thresholdReachedMarker = {
        key: 'thresholdReached',
        index: 2,
        value: 1400,
        severityClass: 'medium',
    };

    test('marks the start and the threshold reached during the forecast', () => {
        expect(getNrwForecastMarkers(timeSeries, '2026-10-21T12:00:00.000Z', mediumThreshold))
            .toEqual([{ key: 'start', index: 1, value: 1200 }, thresholdReachedMarker]);
    });

    test('only marks the threshold reached when the start falls on the same day', () => {
        expect(getNrwForecastMarkers(timeSeries, '2026-10-22T12:00:00.000Z', mediumThreshold))
            .toEqual([thresholdReachedMarker]);
    });

    test('leaves out what is already the case on the first day', () => {
        // Arrange: the event starts and the median reaches the threshold on the first day
        const lowThreshold: NrwSeverityThreshold = {
            returnPeriod: 2,
            thresholdValue: 1000,
            severityClass: 'low',
        };

        // Act & Assert
        expect(getNrwForecastMarkers(timeSeries, '2026-10-20T12:00:00.000Z', lowThreshold))
            .toEqual([]);
    });

    test('leaves out a start outside the forecast and an unreached threshold', () => {
        expect(getNrwForecastMarkers(timeSeries, '2026-10-10T12:00:00.000Z', undefined))
            .toEqual([]);
    });
});

describe('getNrwThresholdAlertClass', () => {
    test('uses the severity class of the threshold', () => {
        expect(getNrwThresholdAlertClass(createThreshold(2, 1, 'low'))).toBe('low');
    });

    test('is undefined for a single threshold, which is not tied to an alert class', () => {
        expect(getNrwThresholdAlertClass(createThreshold(10, 1, 'singleThreshold')))
            .toBeUndefined();
    });

    test('is undefined for a threshold without severity class', () => {
        expect(getNrwThresholdAlertClass(createThreshold(20, 1, null))).toBeUndefined();
    });
});

describe('formatNrwDischarge', () => {
    test('rounds large values to whole numbers', () => {
        expect(formatNrwDischarge(1346.2225)).toBe((1346).toLocaleString());
    });

    test('keeps one decimal for small values', () => {
        expect(formatNrwDischarge(2.17)).toBe((2.2).toLocaleString());
    });
});
