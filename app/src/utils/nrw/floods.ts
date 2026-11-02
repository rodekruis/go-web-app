import { formatNumber } from '@ifrc-go/ui/utils';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import {
    type NrwEvent,
    type NrwFloodsDetails,
    type NrwReturnPeriodThreshold,
    type NrwSeverityThreshold,
} from '#views/CountryProfileNationalRiskWatch/types';

function isNrwSeverityThreshold(
    threshold: NrwReturnPeriodThreshold,
): threshold is NrwSeverityThreshold {
    return isDefined(threshold.severityClass);
}

// The API gives reached higher return periods the class of the level below them,
// so the configured level of each severity class is its lowest threshold.
function getNrwSeverityThresholds(
    returnPeriodThresholds: NrwReturnPeriodThreshold[],
): NrwSeverityThreshold[] {
    const lowestBySeverityClass = new Map<
        NrwSeverityThreshold['severityClass'],
        NrwSeverityThreshold
    >();

    returnPeriodThresholds.filter(isNrwSeverityThreshold).forEach((threshold) => {
        const lowest = lowestBySeverityClass.get(threshold.severityClass);
        if (isNotDefined(lowest) || threshold.returnPeriod < lowest.returnPeriod) {
            lowestBySeverityClass.set(threshold.severityClass, threshold);
        }
    });

    return [...lowestBySeverityClass.values()];
}

// The probability of exceedance refers to this threshold.
export function getNrwReachedSeverityThreshold(
    floodsDetails: NrwFloodsDetails,
): NrwSeverityThreshold | undefined {
    const { returnPeriodThresholds, alertDetails: { peakValue } } = floodsDetails;

    return getNrwSeverityThresholds(returnPeriodThresholds)
        .filter((threshold) => threshold.thresholdValue <= peakValue)
        .reduce<NrwSeverityThreshold | undefined>(
            (highest, threshold) => (
                isDefined(highest) && highest.returnPeriod >= threshold.returnPeriod
                    ? highest
                    : threshold
            ),
            undefined,
        );
}

type NrwTimeSeries = NrwFloodsDetails['alertDetails']['timeSeries'];

function getUtcDay(date: string): string {
    return new Date(date).toISOString().slice(0, 10);
}

// Days are matched by UTC calendar date, like the date axis labels.
export function getNrwTimeSeriesIndex(
    timeSeries: NrwTimeSeries,
    date: string,
): number | undefined {
    const day = getUtcDay(date);

    const index = timeSeries.findIndex(({ start }) => getUtcDay(start) === day);

    return index === -1 ? undefined : index;
}

export function getNrwThresholdReachedIndex(
    timeSeries: NrwTimeSeries,
    value: number,
): number | undefined {
    const index = timeSeries.findIndex(({ median }) => median >= value);

    return index === -1 ? undefined : index;
}

export type NrwForecastMarker = {
    index: number;
    value: number;
} & (
    | { key: 'start' }
    | { key: 'thresholdReached'; severityClass: NrwSeverityThreshold['severityClass'] }
);

// Only moments during the forecast are marked, not what is the case on its first day.
export function getNrwForecastMarkers(
    timeSeries: NrwTimeSeries,
    startAt: string,
    reachedSeverityThreshold: NrwSeverityThreshold | undefined,
): NrwForecastMarker[] {
    function getMedianDuringForecast(index: number | undefined): number | undefined {
        return isDefined(index) && index > 0 ? timeSeries[index]?.median : undefined;
    }

    const markers: NrwForecastMarker[] = [];

    const thresholdReachedIndex = isDefined(reachedSeverityThreshold)
        ? getNrwThresholdReachedIndex(timeSeries, reachedSeverityThreshold.thresholdValue)
        : undefined;

    // The start gives way to the threshold reached on the same day.
    const startIndex = getNrwTimeSeriesIndex(timeSeries, startAt);
    const startValue = getMedianDuringForecast(startIndex);
    if (isDefined(startIndex) && isDefined(startValue) && startIndex !== thresholdReachedIndex) {
        markers.push({ key: 'start', index: startIndex, value: startValue });
    }

    const thresholdReachedValue = getMedianDuringForecast(thresholdReachedIndex);
    if (
        isDefined(reachedSeverityThreshold)
        && isDefined(thresholdReachedIndex)
        && isDefined(thresholdReachedValue)
    ) {
        markers.push({
            key: 'thresholdReached',
            index: thresholdReachedIndex,
            value: thresholdReachedValue,
            severityClass: reachedSeverityThreshold.severityClass,
        });
    }

    return markers;
}

// A single threshold is not tied to an alert class.
export function getNrwThresholdAlertClass(
    threshold: NrwReturnPeriodThreshold,
): NrwEvent['alertClass'] | undefined {
    const { severityClass } = threshold;

    if (severityClass === 'singleThreshold') {
        return undefined;
    }

    return severityClass ?? undefined;
}

// River discharge ranges from a few to thousands of m³/s, so small rivers keep a decimal.
export function formatNrwDischarge(value: number): string {
    const maximumFractionDigits = Math.abs(value) < 10 ? 1 : 0;
    return formatNumber(value, { maximumFractionDigits }) ?? String(value);
}
