import { useMemo } from 'react';

import { alertColors } from '#utils/nrw/nrwMapStyles';
import {
    type AlertClassType,
    type SelectedEventMapDetails,
} from '#utils/nrw/nrwMapTypes';

import styles from './styles.module.css';

interface NrwLegendPanelProps {
    selectedEventDetails: SelectedEventMapDetails | null;
}

// a color and its lower-bound value.
interface LegendEntry {
    color: string;
    label: string;
}

// Debug. Awaiting design.
const getExposureLegend = (
    maxValue: number,
    alertClass: AlertClassType,
): LegendEntry[] => {
    const colors = alertColors[alertClass];
    return colors.map((color, index) => {
        // Convert tier index to a value based on the maxValue, rounded to the nearest 100.
        const value = Math.round(((index / 5) * maxValue) / 100) * 100;

        // Set greater-than or less-than symbols for first and last items.
        let prefix = '';
        if (index === 0) {
            prefix = '<';
        } else if (index === colors.length - 1) {
            prefix = '>';
        }
        return {
            color,
            label: `${prefix}${value.toLocaleString()}`,
        };
    });
};

/**
 * Legend panel shown under the map.
 * TODO: This is debug, and is awaiting design.
 */
export default function NrwLegendPanel({
    selectedEventDetails,
}: NrwLegendPanelProps) {
    const legend = useMemo(() => {
        if (!selectedEventDetails) {
            return null;
        }

        const levels = Object.keys(selectedEventDetails.highestExposedPopulationByLevel)
            .map(Number);
        if (levels.length === 0) {
            return null;
        }
        const deepestLevel = Math.max(...levels);
        const maxValue = selectedEventDetails
            .highestExposedPopulationByLevel[deepestLevel] ?? 0;

        return getExposureLegend(maxValue, selectedEventDetails.alertClass);
    }, [selectedEventDetails]);

    if (!legend) {
        return null;
    }

    return (
        <div className={styles.legendPanel}>
            <span className={styles.legendTitle}>Exposed population:</span>
            <div className={styles.legendEntries}>
                {legend.map((entry) => (
                    <div className={styles.legendEntry} key={entry.color}>
                        <span
                            className={styles.legendSwatch}
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className={styles.legendValue}>
                            {entry.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
