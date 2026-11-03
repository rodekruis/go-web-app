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
    getNrwForecastMarkers,
    getNrwReachedSeverityThreshold,
    getNrwThresholdAlertClass,
    type NrwForecastMarker,
} from '#utils/nrw/floods';
import {
    type NrwEvent,
    type NrwFloodsDetails,
    type NrwSeverityThreshold,
} from '#views/CountryProfileNationalRiskWatch/types';

import i18n from './i18n.json';
import styles from './styles.module.css';

// Fixed chart units, scaled to the card width; label widths are estimated for Poppins.
const chartWidth = 346;
const chartHeight = 140;
const headerBaseline = 12;
// Room for return period labels up to "10 YR".
const plotRight = chartWidth - 32;
// Room for the axis titles above and the dates below, each plus a point radius.
const plotTop = 24;
const plotBottom = 116;
const xAxisBaseline = plotBottom + 20;
const pointRadius = 3;

// Estimated per-character widths of the 12px axis labels.
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

function formatTickDate(value: string): string {
    const date = new Date(value);
    return `${date.getDate()}.${date.getMonth() + 1}`;
}

function formatMarkerDate(value: string): string {
    return new Date(value).toLocaleDateString(
        undefined,
        { day: 'numeric', month: 'long' },
    );
}

type Marker = NrwForecastMarker & { label: string };

// Estimated tag size in chart units, only used to detect overlapping tags.
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

    // The first and last date labels end at the plot edges.
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

    const reachedSeverityThreshold = getNrwReachedSeverityThreshold(floodsDetails);
    const thresholdTags: Record<NrwSeverityThreshold['severityClass'], string> = {
        low: strings.nrwRiverDischargeChartLowThresholdTag,
        medium: strings.nrwRiverDischargeChartMediumThresholdTag,
        high: strings.nrwRiverDischargeChartHighThresholdTag,
        singleThreshold: strings.nrwRiverDischargeChartSingleThresholdTag,
    };
    const markers: Marker[] = getNrwForecastMarkers(
        timeSeries,
        startAt,
        reachedSeverityThreshold,
    ).map((marker) => ({
        ...marker,
        label: marker.key === 'start'
            ? strings.nrwRiverDischargeChartStartTag
            : thresholdTags[marker.severityClass],
    }));

    // The days on which a marker falls are emphasized on the date axis.
    const markedIndices = markers.map(({ index }) => index);

    const chartLabel = [
        strings.nrwRiverDischargeChartLabel,
        ...markers.flatMap(({ label, index }) => {
            const entry = timeSeries[index];
            return isDefined(entry)
                ? [resolveToString(
                    strings.nrwRiverDischargeChartMarkerDescription,
                    { tag: label, date: formatMarkerDate(entry.start) },
                )]
                : [];
        }),
    ].join('. ');

    // When two tags overlap, the tag of the lower marker moves below it.
    function getMarkerKeyWithTagBelow(): Marker['key'] | undefined {
        const [firstMarker, secondMarker] = markers;
        if (isNotDefined(firstMarker) || isNotDefined(secondMarker)) {
            return undefined;
        }

        const tagsOverlap = Math.abs(getX(firstMarker.index) - getX(secondMarker.index))
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
                    aria-label={chartLabel}
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
                    {markers.map(({ key, index, value }) => (
                        <circle
                            key={key}
                            className={styles.marker}
                            cx={getX(index)}
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
                    index,
                    value,
                }) => (
                    <span
                        key={key}
                        className={_cs(styles.tag, key === markerKeyWithTagBelow && styles.below)}
                        aria-hidden
                        style={{
                            left: `${(getX(index) / chartWidth) * 100}%`,
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
