import { isDefined } from '@togglecorp/fujs';

// Label widths are estimated in chart units for Poppins, not measured from the rendered text.

// Estimated per-character widths of 12px axis labels.
const axisCharacterWidth = 6.5;
export const nrwAxisTitleCharacterWidth = 7.2;
const axisPunctuationWidth = 3;

// Translated strings can be missing for a render while their namespace registers.
export function getNrwAxisLabelWidth(
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

// Estimated size of a 10px uppercase tag with padding.
const tagCharacterWidth = 6.5;
const tagPaddingWidth = 15;
export const nrwTagHeight = 15;

export function getNrwTagWidth(label: string | undefined): number {
    return (label?.length ?? 0) * tagCharacterWidth + tagPaddingWidth;
}

// Local time, like the other event card dates; the event start is always a forecast day start.
export function formatNrwTickDate(value: string): string {
    const date = new Date(value);
    return `${date.getDate()}.${date.getMonth() + 1}`;
}

export function formatNrwMarkerDate(value: string): string {
    return new Date(value).toLocaleDateString(
        undefined,
        { day: 'numeric', month: 'long' },
    );
}

// Label positions as close as possible to the given positions, but at least the given gap apart
// and within the bounds. Positions grow downwards, as in SVG.
export function spreadNrwLabelPositions(
    positions: number[],
    gap: number,
    bounds: { min: number; max: number },
): number[] {
    const order = positions
        .map((position, index) => ({ position, index }))
        .sort((a, b) => a.position - b.position);

    // Clusters of labels that sit too close together, each centred on its own positions.
    const clusters: { indices: number[]; positions: number[]; start: number }[] = [];
    order.forEach(({ position, index }) => {
        clusters.push({ indices: [index], positions: [position], start: position });

        // Merge with the cluster above while they overlap.
        let current = clusters.at(-1);
        let previous = clusters.at(-2);
        while (
            isDefined(current)
            && isDefined(previous)
            && previous.start + previous.indices.length * gap > current.start
        ) {
            const merged = {
                indices: [...previous.indices, ...current.indices],
                positions: [...previous.positions, ...current.positions],
                start: 0,
            };
            const mean = merged.positions.reduce((sum, value) => sum + value, 0)
                / merged.positions.length;
            merged.start = mean - ((merged.indices.length - 1) * gap) / 2;

            clusters.splice(-2, 2, merged);
            current = clusters.at(-1);
            previous = clusters.at(-2);
        }
    });

    const spread: number[] = [];
    clusters.forEach(({ indices, start }) => {
        const height = (indices.length - 1) * gap;
        const clampedStart = Math.min(Math.max(start, bounds.min), bounds.max - height);
        indices.forEach((index, rank) => {
            spread[index] = clampedStart + rank * gap;
        });
    });

    // Keep the gap after clamping a cluster to the bounds, top-down then bottom-up.
    const sortedIndices = order.map(({ index }) => index);
    sortedIndices.forEach((index, rank) => {
        const above = sortedIndices[rank - 1];
        if (isDefined(above)) {
            spread[index] = Math.max(spread[index] ?? 0, (spread[above] ?? 0) + gap);
        }
    });
    [...sortedIndices].reverse().forEach((index, reverseRank) => {
        const below = sortedIndices[sortedIndices.length - reverseRank];
        if (isDefined(below)) {
            spread[index] = Math.min(spread[index] ?? 0, (spread[below] ?? 0) - gap);
        }
    });

    return spread;
}
