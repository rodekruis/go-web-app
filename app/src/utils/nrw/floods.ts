import { formatNumber } from '@ifrc-go/ui/utils';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import {
    type NrwEvent,
    type NrwFloodsDetails,
    type NrwReturnPeriodThreshold,
} from '#views/CountryProfileNationalRiskWatch/types';

// The configured severity thresholds. The API classifies every threshold by the highest
// severity level it reaches, so higher return periods that the peak reaches get the class
// of the level below them. The configured level of each class is its lowest threshold.
function getNrwSeverityThresholds(
    returnPeriodThresholds: NrwReturnPeriodThreshold[],
): NrwReturnPeriodThreshold[] {
    const lowestBySeverityClass = new Map<
        NonNullable<NrwReturnPeriodThreshold['severityClass']>,
        NrwReturnPeriodThreshold
    >();

    returnPeriodThresholds.forEach((threshold) => {
        const { severityClass } = threshold;
        if (isNotDefined(severityClass)) {
            return;
        }

        const lowest = lowestBySeverityClass.get(severityClass);
        if (isNotDefined(lowest) || threshold.returnPeriod < lowest.returnPeriod) {
            lowestBySeverityClass.set(severityClass, threshold);
        }
    });

    return [...lowestBySeverityClass.values()];
}

// The highest severity threshold reached by the forecasted (median) peak.
// The probability of exceedance refers to this threshold.
export function getNrwReachedSeverityThreshold(
    floodsDetails: NrwFloodsDetails,
): NrwReturnPeriodThreshold | undefined {
    const { returnPeriodThresholds, alertDetails: { peakValue } } = floodsDetails;

    return getNrwSeverityThresholds(returnPeriodThresholds)
        .filter((threshold) => threshold.thresholdValue <= peakValue)
        .reduce<NrwReturnPeriodThreshold | undefined>(
            (highest, threshold) => (
                isDefined(highest) && highest.returnPeriod >= threshold.returnPeriod
                    ? highest
                    : threshold
            ),
            undefined,
        );
}

type NrwTimeSeries = NrwFloodsDetails['alertDetails']['timeSeries'];

// The index of the time series entry (day) that contains the given date.
// Undefined for a date outside of the time series.
export function getNrwTimeSeriesIndex(
    timeSeries: NrwTimeSeries,
    date: string,
): number | undefined {
    const time = new Date(date).getTime();

    const index = timeSeries.findIndex(({ start, end }) => (
        new Date(start).getTime() <= time && time < new Date(end).getTime()
    ));

    return index === -1 ? undefined : index;
}

// The index of the first time series entry (day) whose median reaches the given value.
// Undefined when the median already reaches it on the first day, or never does.
export function getNrwThresholdReachedIndex(
    timeSeries: NrwTimeSeries,
    value: number,
): number | undefined {
    const index = timeSeries.findIndex(({ median }) => median >= value);

    return index > 0 ? index : undefined;
}

// The alert class to colour a threshold with. A single threshold, which is not tied to
// an alert class, and a threshold without severity class get none.
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
