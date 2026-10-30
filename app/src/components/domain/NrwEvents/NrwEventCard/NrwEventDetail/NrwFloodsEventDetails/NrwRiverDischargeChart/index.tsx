import { faCircleInfo } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { resolveToString } from '@ifrc-go/ui/utils';
import {
    _cs,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import { alertClassNames } from '#utils/nrw/colors';
import {
    formatNrwDischarge,
    getNrwReachedSeverityThreshold,
    getNrwThresholdAlertClass,
    getNrwThresholdReachedIndex,
    getNrwTimeSeriesIndex,
} from '#utils/nrw/floods';
import {
    type NrwEvent,
    type NrwFloodsDetails,
    type NrwReturnPeriodThreshold,
} from '#views/CountryProfileNationalRiskWatch/types';

import i18n from './i18n.json';
import styles from './styles.module.css';

// The chart is drawn in a fixed coordinate space and scales with the card width.
// Labels are positioned without measuring the rendered text: widths are estimated from
// per-character widths, tuned against Poppins at the chart's font sizes. A different font
// or very wide characters (e.g. in a translation) can make them a few units off.
const chartWidth = 346;
const chartHeight = 140;
const headerBaseline = 12;
// Fixed room for the return period labels on the right, sized for labels up to "10 YR".
// Wider ones, like "100 YR", would touch the end of the threshold lines.
const plotRight = chartWidth - 32;
// The values span the plot from top to bottom. The margins below are fixed in chart units:
// the plot starts just below the axis titles (with room for a point's radius), and ends
// with room for a point above the dates.
const plotTop = 24;
const plotBottom = 116;
const xAxisBaseline = plotBottom + 20;
const pointRadius = 3;

// The plot starts right after the widest label on its left: a threshold value or the
// date axis title. Estimated per-character widths of the 12px axis labels:
const axisCharacterWidth = 6.5;
const axisTitleCharacterWidth = 7.2;
const axisPunctuationWidth = 3;
const axisLabelGap = 10;

// Translated strings can be missing for a render while their namespace registers.
function getAxisLabelWidth(
    label: string | undefined,
    characterWidth: number = axisCharacterWidth,
): number {
    return [...(label ?? '')].reduce(
        (width, character) => width + (
            character === ',' || character === '.' ? axisPunctuationWidth : characterWidth
        ),
        0,
    );
}

// Short day.month label for the date axis, e.g. 19.3
function formatTickDate(value: string): string {
    const date = new Date(value);
    return `${date.getDate()}.${date.getMonth() + 1}`;
}

interface Marker {
    key: string;
    label: string;
    position: number;
    value: number;
}

// Estimated tag size in chart units (10px uppercase label plus padding). Only used to
// decide whether two tags overlap, so a small error just moves a tag below its marker
// a bit early or late.
const tagCharacterWidth = 6.5;
const tagPaddingWidth = 15;
const tagHeight = 15;

// Translated strings can be missing for a render while their namespace registers.
function getTagWidth(label: string | undefined): number {
    return (label?.length ?? 0) * tagCharacterWidth + tagPaddingWidth;
}

interface Props {
    className?: string;
    floodsDetails: NrwFloodsDetails;
    alertClass: NrwEvent['alertClass'];
    startAt: NrwEvent['startAt'];
}

function NrwRiverDischargeChart(props: Props) {
    const {
        className,
        floodsDetails,
        alertClass,
        startAt,
    } = props;
    const { alertDetails, returnPeriodThresholds } = floodsDetails;
    const { timeSeries, peakValue, probabilityOfExceedance } = alertDetails;

    const strings = useTranslation(i18n);

    const [firstEntry] = timeSeries;
    if (isNotDefined(firstEntry)) {
        return null;
    }

    const thresholdValues = returnPeriodThresholds.map(({ thresholdValue }) => thresholdValue);
    const valueMax = Math.max(
        peakValue,
        ...thresholdValues,
        ...timeSeries.map(({ high }) => high),
    );
    const valueMin = Math.min(
        ...thresholdValues,
        ...timeSeries.map(({ low }) => low),
    );
    const valueRange = valueMax - valueMin || 1;

    const dateTitleWidth = getAxisLabelWidth(
        strings.nrwRiverDischargeChartDateAxis,
        axisTitleCharacterWidth,
    );
    const plotLeft = Math.max(
        dateTitleWidth,
        ...thresholdValues.map((value) => getAxisLabelWidth(formatNrwDischarge(value))),
    ) + axisLabelGap;

    // The dates span the plot from edge to edge, evenly spaced, with each data point above
    // the centre of its date: the first date starts at the left edge, the last ends at the
    // right edge. The threshold lines span the full plot.
    const firstDateHalfWidth = getAxisLabelWidth(formatTickDate(firstEntry.start)) / 2;
    const lastDateHalfWidth = getAxisLabelWidth(
        formatTickDate(timeSeries.at(-1)?.start ?? firstEntry.start),
    ) / 2;
    const dataLeft = plotLeft + firstDateHalfWidth;
    const dataRight = plotRight - lastDateHalfWidth;

    const lastIndex = Math.max(timeSeries.length - 1, 1);
    const getX = (position: number) => (
        dataLeft + (position / lastIndex) * (dataRight - dataLeft)
    );
    const getY = (value: number) => (
        plotBottom - ((value - valueMin) / valueRange) * (plotBottom - plotTop)
    );

    const medianPoints = timeSeries
        .map(({ median }, index) => `${getX(index)},${getY(median)}`)
        .join(' ');
    const rangeUpperPoints = timeSeries.map(({ high }, index) => `${getX(index)},${getY(high)}`);
    const rangeLowerPoints = timeSeries
        .map(({ low }, index) => `${getX(index)},${getY(low)}`)
        .reverse();
    const rangePath = `M${[...rangeUpperPoints, ...rangeLowerPoints].join(' L')} Z`;

    const markers: Marker[] = [];

    // Markers sit on the median of the forecast day they fall on. They only mark moments
    // that happen during the forecast: whatever is already the case on its first day,
    // like a started event or a reached threshold, gets no marker.
    const reachedSeverityThreshold = getNrwReachedSeverityThreshold(floodsDetails);
    const thresholdReachedIndex = isDefined(reachedSeverityThreshold)
        ? getNrwThresholdReachedIndex(timeSeries, reachedSeverityThreshold.thresholdValue)
        : undefined;
    const thresholdReachedEntry = isDefined(thresholdReachedIndex)
        ? timeSeries[thresholdReachedIndex]
        : undefined;

    // The start gives way to the threshold reached on the same day.
    const startIndex = getNrwTimeSeriesIndex(timeSeries, startAt);
    const startEntry = isDefined(startIndex) && startIndex > 0
        ? timeSeries[startIndex]
        : undefined;
    if (isDefined(startIndex) && isDefined(startEntry) && startIndex !== thresholdReachedIndex) {
        markers.push({
            key: 'start',
            label: strings.nrwRiverDischargeChartStartTag,
            position: startIndex,
            value: startEntry.median,
        });
    }

    if (
        isDefined(thresholdReachedIndex)
        && isDefined(thresholdReachedEntry)
        && isDefined(reachedSeverityThreshold)
    ) {
        const thresholdTags: Record<
            NonNullable<NrwReturnPeriodThreshold['severityClass']>,
            string
        > = {
            low: strings.nrwRiverDischargeChartLowThresholdTag,
            medium: strings.nrwRiverDischargeChartMediumThresholdTag,
            high: strings.nrwRiverDischargeChartHighThresholdTag,
            singleThreshold: strings.nrwRiverDischargeChartSingleThresholdTag,
        };

        markers.push({
            key: 'thresholdReached',
            label: isDefined(reachedSeverityThreshold.severityClass)
                ? thresholdTags[reachedSeverityThreshold.severityClass]
                : strings.nrwRiverDischargeChartSingleThresholdTag,
            position: thresholdReachedIndex,
            value: thresholdReachedEntry.median,
        });
    }

    // The days on which a marker falls are emphasized on the date axis.
    const markedIndices = markers.map(({ position }) => position);

    // Tags sit above their marker. When two tags would overlap, the tag of the lower
    // marker moves below it instead.
    function getMarkerKeyWithTagBelow(): Marker['key'] | undefined {
        const [firstMarker, secondMarker] = markers;
        if (isNotDefined(firstMarker) || isNotDefined(secondMarker)) {
            return undefined;
        }

        const tagsOverlap = Math.abs(getX(firstMarker.position) - getX(secondMarker.position))
                < (getTagWidth(firstMarker.label) + getTagWidth(secondMarker.label)) / 2
            && Math.abs(getY(firstMarker.value) - getY(secondMarker.value)) < tagHeight;
        if (!tagsOverlap) {
            return undefined;
        }

        return firstMarker.value < secondMarker.value ? firstMarker.key : secondMarker.key;
    }
    const markerKeyWithTagBelow = getMarkerKeyWithTagBelow();

    return (
        <div
            className={_cs(
                styles.nrwRiverDischargeChart,
                alertClassNames[alertClass],
                className,
            )}
        >
            <div className={styles.plot}>
                <svg
                    className={styles.chart}
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    role="img"
                    aria-label={strings.nrwRiverDischargeChartLabel}
                >
                    <text
                        className={styles.axisTitle}
                        x={0}
                        y={headerBaseline}
                    >
                        {strings.nrwRiverDischargeChartUnit}
                    </text>
                    <text
                        className={styles.axisTitle}
                        x={chartWidth}
                        y={headerBaseline}
                        textAnchor="end"
                    >
                        {strings.nrwRiverDischargeChartReturnPeriodAxis}
                    </text>
                    {returnPeriodThresholds.map((threshold) => {
                        const y = getY(threshold.thresholdValue);
                        const thresholdAlertClass = getNrwThresholdAlertClass(threshold);

                        return (
                            <g
                                key={threshold.returnPeriod}
                                className={_cs(
                                    styles.threshold,
                                    thresholdAlertClass && alertClassNames[thresholdAlertClass],
                                    threshold.severityClass === 'singleThreshold'
                                        && styles.singleThreshold,
                                    threshold.severityClass === null && styles.withoutSeverity,
                                )}
                            >
                                <line
                                    x1={plotLeft}
                                    y1={y}
                                    x2={plotRight}
                                    y2={y}
                                />
                                <text
                                    className={styles.tick}
                                    x={0}
                                    y={y}
                                    dominantBaseline="middle"
                                >
                                    {formatNrwDischarge(threshold.thresholdValue)}
                                </text>
                                <text
                                    className={styles.returnPeriod}
                                    x={chartWidth}
                                    y={y}
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                >
                                    {resolveToString(
                                        strings.nrwRiverDischargeChartReturnPeriod,
                                        { returnPeriod: threshold.returnPeriod },
                                    )}
                                </text>
                            </g>
                        );
                    })}
                    <path className={styles.range} d={rangePath} />
                    <polyline className={styles.median} points={medianPoints} />
                    <circle
                        className={styles.current}
                        cx={getX(0)}
                        cy={getY(firstEntry.median)}
                        r={pointRadius}
                    />
                    {markers.map(({ key, position, value }) => (
                        <circle
                            key={key}
                            className={styles.marker}
                            cx={getX(position)}
                            cy={getY(value)}
                            r={pointRadius}
                        />
                    ))}
                    <text
                        className={styles.axisTitle}
                        x={0}
                        y={xAxisBaseline}
                    >
                        {strings.nrwRiverDischargeChartDateAxis}
                    </text>
                    {timeSeries.map(({ start }, index) => (
                        <text
                            key={start}
                            className={_cs(
                                styles.tick,
                                markedIndices.includes(index) && styles.markedTick,
                            )}
                            x={getX(index)}
                            y={xAxisBaseline}
                            textAnchor="middle"
                        >
                            {formatTickDate(start)}
                        </text>
                    ))}
                </svg>
                {markers.map(({
                    key,
                    label,
                    position,
                    value,
                }) => (
                    <span
                        key={key}
                        className={_cs(styles.tag, key === markerKeyWithTagBelow && styles.below)}
                        style={{
                            left: `${(getX(position) / chartWidth) * 100}%`,
                            top: `${(getY(value) / chartHeight) * 100}%`,
                        }}
                    >
                        {label}
                    </span>
                ))}
            </div>
            <div className={styles.legend}>
                <div className={styles.legendItems}>
                    <span className={styles.legendItem}>
                        <span className={styles.medianSwatch} />
                        {strings.nrwRiverDischargeChartMedianLegend}
                    </span>
                    <span className={styles.legendItem}>
                        <span className={styles.rangeSwatch} />
                        <span className={styles.legendLabel}>
                            {strings.nrwRiverDischargeChartRangeLegend}
                            <span className={styles.rangeInfo}>
                                <FontAwesomeIcon icon={faCircleInfo} />
                                <Tooltip
                                    className={styles.rangeInfoTooltip}
                                    description={strings.nrwRiverDischargeChartRangeDescription}
                                />
                            </span>
                        </span>
                    </span>
                </div>
                {isDefined(probabilityOfExceedance) && isDefined(reachedSeverityThreshold) && (
                    <div>
                        {resolveToString(
                            strings.nrwRiverDischargeChartProbability,
                            {
                                probability: Math.round(probabilityOfExceedance * 100),
                                returnPeriod: reachedSeverityThreshold.returnPeriod,
                            },
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default NrwRiverDischargeChart;
