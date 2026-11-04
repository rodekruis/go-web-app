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

import {
    formatNrwMarkerDate,
    formatNrwTickDate,
    getNrwAxisLabelWidth,
    getNrwTagWidth,
    nrwAxisTitleCharacterWidth,
    nrwTagHeight,
    spreadNrwLabelPositions,
} from '#utils/nrw/chart';
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

// TODO: make this chart generic on a next hazard-type,
// moving the flood-specific parts (thresholds, return periods, markers) to this component.

// Fixed chart units, scaled to the card width.
const chartWidth = 346;
const chartHeight = 140;
const headerBaseline = 12;
// Room for return period labels up to "10 YR".
const plotRight = chartWidth - 32;
// Room for the axis titles above and the dates below, each plus a point radius.
const plotTop = 24;
const plotBottom = 116;
const xAxisBaseline = plotBottom + 20;
// Height of a threshold label line (12px values, 10px "X YR" labels).
const thresholdLabelHeight = 13;
const pointRadius = 3;
const axisLabelGap = 10;

type Marker = NrwForecastMarker & { label: string };

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

    const dateTitleWidth = getNrwAxisLabelWidth(
        strings.nrwRiverDischargeChartDateAxis,
        nrwAxisTitleCharacterWidth,
    );
    const plotLeft = Math.max(
        dateTitleWidth,
        ...thresholdValues.map((value) => getNrwAxisLabelWidth(formatNrwDischarge(value))),
    ) + axisLabelGap;

    const lastIndex = Math.max(timeSeries.length - 1, 1);
    const getX = (position: number) => (
        plotLeft + (position / lastIndex) * (plotRight - plotLeft)
    );
    // The outer dates align with the plot edges, so the data spans the full plot.
    const getDateAnchor = (index: number): 'start' | 'middle' | 'end' => {
        if (index === 0) {
            return 'start';
        }
        return index === lastIndex ? 'end' : 'middle';
    };
    const getY = (value: number) => (
        plotBottom - ((value - valueMin) / valueRange) * (plotBottom - plotTop)
    );

    // The lines keep their value; only labels too close together are spread apart.
    const thresholdLabelYs = spreadNrwLabelPositions(
        returnPeriodThresholds.map(({ thresholdValue }) => getY(thresholdValue)),
        thresholdLabelHeight,
        { min: plotTop, max: plotBottom },
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
        returnPeriodThresholds,
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
                    { tag: label, date: formatNrwMarkerDate(entry.start) },
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
                < (getNrwTagWidth(firstMarker.label) + getNrwTagWidth(secondMarker.label)) / 2
            && Math.abs(getY(firstMarker.value) - getY(secondMarker.value)) < nrwTagHeight;
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
                    {returnPeriodThresholds.map((threshold, thresholdIndex) => {
                        const y = getY(threshold.thresholdValue);
                        const labelY = thresholdLabelYs[thresholdIndex] ?? y;
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
                                    y={labelY}
                                    dominantBaseline="middle"
                                >
                                    {formatNrwDischarge(threshold.thresholdValue)}
                                </text>
                                <text
                                    className={styles.returnPeriod}
                                    x={chartWidth}
                                    y={labelY}
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
                    {markers.map(({
                        key,
                        index,
                        value,
                        severityClass,
                    }) => (
                        <circle
                            key={key}
                            className={_cs(
                                styles.marker,
                                severityClass === 'singleThreshold' && styles.singleThreshold,
                                isDefined(severityClass)
                                    && severityClass !== 'singleThreshold'
                                    && alertClassNames[severityClass],
                            )}
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
                                styles.dateTick,
                                markedIndices.includes(index) && styles.markedTick,
                            )}
                            x={getX(index)}
                            y={xAxisBaseline}
                            textAnchor={getDateAnchor(index)}
                        >
                            {formatNrwTickDate(start)}
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
