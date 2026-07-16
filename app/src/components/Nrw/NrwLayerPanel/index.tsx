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
 * Panel that shows available layers for the scoped countries and events
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
