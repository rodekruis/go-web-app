import {
    useCallback,
    useContext,
    useMemo,
} from 'react';
import { NumberOutput } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import { type Map as MapboxMap } from 'mapbox-gl-v3';

import { mapUnselectedStyle } from '#utils/nrw/colors';
import NrwAdminAreasContext from '#views/CountryProfileNationalRiskWatch/NrwAdminAreasProvider/NrwAdminAreasContext';
import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import { type AdminAreaProperties } from '#views/CountryProfileNationalRiskWatch/types';
import { getFeatureCollectionBounds } from '#views/CountryProfileNationalRiskWatch/utils';

import {
    popupFlipRightThreshold,
    popupFlipTopThreshold,
} from '../../../popupFlipThresholds';
import NrwMapContext from '../../NrwMapContext';
import NrwMarker from '../../NrwMarker';
import { type NrwMarkerPlacement } from '../../NrwMarker/useNrwMapMarker';
import useNrwMapFitBounds from '../../useNrwMapFitBounds';
import useNrwMapLayers from '../useNrwMapLayers';
import getAdminAreaLayer, { getFlatAdminAreaLayer } from './getAdminAreaLayer';
import useAdminAreaClick from './useAdminAreaClick';
import useAdminAreaHover, { type HoveredAdminAreaAnchor } from './useAdminAreaHover';

import i18n from './i18n.json';
import styles from './styles.module.css';

// The tooltip sits above-right of the cursor by default. Flip it to below
// when close to the top edge, and to the left when close to the right edge.
interface TooltipPlacementParams {
    coordinates: NrwLngLat;
    anchor: HoveredAdminAreaAnchor;
    map: MapboxMap | undefined;
}

function getTooltipPlacement(
    { coordinates, anchor, map }: TooltipPlacementParams,
): NrwMarkerPlacement {
    if (anchor === 'area') {
        return { anchor: 'bottom', offset: [0, -10] };
    }

    if (isNotDefined(map)) {
        // Unlikely
        return { anchor: 'bottom-left', offset: [14, -10] };
    }

    const canvas = map.getCanvas();
    const point = map.project([coordinates.lng, coordinates.lat]);
    const nearTop = point.y < popupFlipTopThreshold;
    const nearRight = point.x > canvas.clientWidth - popupFlipRightThreshold;

    const anchorY = nearTop ? 'top' : 'bottom';
    const anchorX = nearRight ? 'right' : 'left';
    const offsetX = nearRight ? -14 : 14;
    const offsetY = nearTop ? 10 : -10;

    return { anchor: `${anchorY}-${anchorX}`, offset: [offsetX, offsetY] };
}

function NrwShapeLayer(props: {
    id: string;
    isVisible: boolean;
    layerAnchorId: string; // Used to connect layer to statically ordered "anchor" layers in MapBox
}) {
    const { id, isVisible, layerAnchorId } = props;

    const {
        adminAreas,
        unselectedAdminAreas,
        exposedPopulationScale,
        adminLevelLabels,
        pending,
        hoveredPlaceCode,
        onAdminAreaHoverChange,
        canDrillDown,
        drillDown,
    } = useContext(NrwAdminAreasContext);

    const { map } = useContext(NrwMapContext);

    const strings = useTranslation(i18n);
    const unselectedId = `${id}-unselected`;

    // Fit the map to the admin areas of the level drilled into.
    const bounds = useMemo(
        () => (isDefined(adminAreas) ? getFeatureCollectionBounds(adminAreas) : undefined),
        [adminAreas],
    );
    useNrwMapFitBounds(bounds);

    // The unselected admin areas go first, so the selected outlines stay on top on shared borders.
    const mapLayers = useMemo(
        () => {
            if (isNotDefined(adminAreas) || isNotDefined(exposedPopulationScale)) {
                return undefined;
            }

            const unselectedMapLayers = isDefined(unselectedAdminAreas)
                ? getFlatAdminAreaLayer(unselectedId, unselectedAdminAreas, mapUnselectedStyle)
                : [];
            const selectedMapLayers = getAdminAreaLayer(id, adminAreas, exposedPopulationScale);

            return [...unselectedMapLayers, ...selectedMapLayers];
        },
        [id, unselectedId, adminAreas, unselectedAdminAreas, exposedPopulationScale],
    );
    useNrwMapLayers(mapLayers, isVisible, layerAnchorId);

    const isInteractive = isDefined(mapLayers) && isVisible;
    // Only the layers on the map, kept stable so the hover and click listeners don't re-register.
    const hasUnselectedAdminAreas = isDefined(unselectedAdminAreas);
    const interactiveLayerIds = useMemo(
        () => (hasUnselectedAdminAreas ? [id, unselectedId] : [id]),
        [id, unselectedId, hasUnselectedAdminAreas],
    );

    const { hoveredAdminArea, clearHover } = useAdminAreaHover(
        interactiveLayerIds,
        isInteractive,
        adminAreas,
        hoveredPlaceCode,
        onAdminAreaHoverChange,
        canDrillDown,
    );

    // A click drills down into a selected admin area, or sideways (maybe up) into unselected ones.
    const handleClick = useCallback(
        (adminArea: AdminAreaProperties) => {
            clearHover();
            drillDown(adminArea);
        },
        [drillDown, clearHover],
    );
    // The last level stays on the map while the next loads, so hold clicks until then.
    useAdminAreaClick(interactiveLayerIds, isInteractive && !pending, canDrillDown, handleClick);

    if (isNotDefined(hoveredAdminArea) || !isVisible) {
        return null;
    }

    // The grey admin areas can be of several levels, so the tooltip names the level.
    const adminLevelLabel = adminLevelLabels?.[hoveredAdminArea.adminLevel]?.singular;

    return (
        <NrwMarker
            key={hoveredAdminArea.anchor}
            coordinates={hoveredAdminArea.coordinates}
            placement={getTooltipPlacement(
                { coordinates: hoveredAdminArea.coordinates, anchor: hoveredAdminArea.anchor, map },
            )}
        >
            <div className={styles.adminAreaTooltip}>
                <div className={styles.heading}>
                    <span className={styles.name}>
                        {hoveredAdminArea.name}
                    </span>
                    {isDefined(adminLevelLabel) && (
                        <span className={styles.adminLevel}>
                            {adminLevelLabel}
                        </span>
                    )}
                </div>
                <div className={styles.exposedPopulation}>
                    {strings.nrwShapeLayerExposedPopulationLabel}
                    <NumberOutput
                        value={exposedPopulationScale?.exposedPopulationByPlaceCode.get(
                            hoveredAdminArea.placeCode,
                        )}
                        invalidText="--"
                    />
                </div>
            </div>
        </NrwMarker>
    );
}

export default NrwShapeLayer;
