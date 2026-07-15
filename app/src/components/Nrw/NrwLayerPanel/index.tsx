/* eslint-disable @typescript-eslint/no-unused-vars */

import { type LayerDto } from '#utils/nrw/shared-dtos';

interface NrwLayerPanelProps {
    eventLayers: LayerDto[];
    nonEventLayers: LayerDto[];
    onToggleMapLayer: (layerName: string) => void;
    onHideAllLayers: () => void;
    visibleLayerNames: string[];
}

/**
 * Control panel showing layers that can be toggled for the selected event and scoped countries.
 * Country-scoped layers are shown as a single toggle per layer type; toggling one
 * affects that layer for every scoped country.
 */
export default function NrwLayerPanel({
    eventLayers,
    nonEventLayers,
    onToggleMapLayer,
    onHideAllLayers,
    visibleLayerNames,
}: NrwLayerPanelProps) {
    const hasAnyLayers = eventLayers.length > 0 || nonEventLayers.length > 0;

    if (!hasAnyLayers) {
        return (
            <div />
        );
    }

    return (
        <div />
    );
}
