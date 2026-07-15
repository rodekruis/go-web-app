import { useMemo } from 'react';

import {
    alertColors,
    tierLevelToNumber,
} from '#utils/nrw/nrwMapStyles';
import { type EventResponseDto } from '#utils/nrw/shared-dtos';
import {
    type AlertClass,
    LayerName,
} from '#utils/nrw/shared-enums';

import styles from './styles.module.css';

interface NrwLegendPanelProps {
    selectedEvent: EventResponseDto | null;
}

// a color and its lower-bound value.
interface LegendEntry {
    color: string;
    label: string;
}

// Debug. Awaiting design.
const getExposureLegend = (
    highestValue: number,
    alertClass: AlertClass,
): LegendEntry[] => {
    const colors = alertColors[alertClass];

    // Convert a tier level to a value based on the highestValue, rounded to the nearest 100.
    const getValue = (
        tierLevel: number,
    ) => tierLevelToNumber(tierLevel, colors.length, highestValue, 100);

    return colors.map((color, tierLevel) => {
        let label: string;
        if (tierLevel === 0) {
            // First item uses a less-than symbol, plus the value of the 2nd tier
            // (since the first tier base value is 0).
            label = `<${getValue(1).toLocaleString()}`;
        } else if (tierLevel === colors.length - 1) {
            // Last item uses a greater-than symbol, plus the value of the top tier.
            label = `>${getValue(tierLevel).toLocaleString()}`;
        } else {
            // Middle items show the range from this tier value to the next.
            label = `${getValue(tierLevel).toLocaleString()} to ${getValue(tierLevel + 1).toLocaleString()}`;
        }
        return {
            color,
            label,
        };
    });
};

/**
 * Legend panel shown under the map.
 * TODO: This is debug, and is awaiting design.
 */
export default function NrwLegendPanel({
    selectedEvent,
}: NrwLegendPanelProps) {
    const legend = useMemo(() => {
        if (!selectedEvent) {
            return null;
        }

        // Use the deepest (lowest) admin level that has exposed areas,
        // matching the areas drawn on the map.
        const { exposedAdminAreas } = selectedEvent;
        const deepestLevel = Object.keys(exposedAdminAreas).at(-1);
        const deepestAreas = deepestLevel !== undefined
            ? exposedAdminAreas[deepestLevel]
            : undefined;
        if (deepestAreas === undefined) {
            return null;
        }

        // Find the highest exposed population value among the areas
        const highestValue = Math.max(
            0,
            ...deepestAreas.map((area) => (
                area.exposure.find(
                    (layer) => layer.layerName === LayerName.populationExposed,
                )?.exposed ?? 0
            )),
        );

        return getExposureLegend(highestValue, selectedEvent.alertClass);
    }, [selectedEvent]);

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
