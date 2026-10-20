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

import NrwAdminAreasContext from '#views/CountryProfileNationalRiskWatch/NrwAdminAreasProvider/NrwAdminAreasContext';
import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import { type AdminAreaProperties } from '#views/CountryProfileNationalRiskWatch/types';
import { getFeatureCollectionBounds } from '#views/CountryProfileNationalRiskWatch/utils';

import NrwMapContext from '../../NrwMapContext';
import NrwMarker from '../../NrwMarker';
import { type NrwMarkerPlacement } from '../../NrwMarker/useNrwMapMarker';
import {
    popupFlipRightThreshold,
    popupFlipTopThreshold,
} from '../../popupFlipThresholds';
import useNrwMapFitBounds from '../../useNrwMapFitBounds';
import useNrwMapLayers from '../useNrwMapLayers';
import getAdminAreaLayer from './getAdminAreaLayer';
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

// Drilling back up on a click beside the admin areas is disabled for now.
// Set this to true to enable it again; the Back button in the event card always drills up.
const drillUpOnOutsideClick = false;

function NrwShapeLayer(props: {
    id: string;
    isVisible: boolean;
    layerAnchorId: string; // Used to connect layer to statically ordered "anchor" layers in MapBox
}) {
    const { id, isVisible, layerAnchorId } = props;

    const {
        adminAreas,
        exposedPopulationScale,
        pending,
        hoveredPlaceCode,
        onAdminAreaHoverChange,
        canDrillDown,
        drillDown,
        drillUp,
    } = useContext(NrwAdminAreasContext);

    const { map } = useContext(NrwMapContext);

    const strings = useTranslation(i18n);

    // Fit the map to the admin areas of the level drilled into.
    const bounds = useMemo(
        () => (isDefined(adminAreas) ? getFeatureCollectionBounds(adminAreas) : undefined),
        [adminAreas],
    );
    useNrwMapFitBounds(bounds);

    const mapLayers = useMemo(
        () => (isDefined(adminAreas) && isDefined(exposedPopulationScale)
            ? getAdminAreaLayer(id, adminAreas, exposedPopulationScale)
            : undefined),
        [id, adminAreas, exposedPopulationScale],
    );
    useNrwMapLayers(mapLayers, isVisible, layerAnchorId);

    const isInteractive = isDefined(mapLayers) && isVisible;
    const { hoveredAdminArea, clearHover } = useAdminAreaHover(
        id,
        isInteractive,
        adminAreas,
        hoveredPlaceCode,
        onAdminAreaHoverChange,
        canDrillDown,
    );

    // Drill into the clicked admin area, or (when enabled) back up on a click beside them.
    const handleClick = useCallback(
        (adminArea: AdminAreaProperties | null) => {
            if (adminArea === null) {
                if (drillUpOnOutsideClick) {
                    drillUp();
                }
                return;
            }

            clearHover();
            drillDown(adminArea);
        },
        [drillDown, drillUp, clearHover],
    );
    // The last level stays on the map while the next loads, so hold clicks until then.
    useAdminAreaClick(id, isInteractive && !pending, canDrillDown, handleClick);

    if (isNotDefined(hoveredAdminArea) || !isVisible) {
        return null;
    }

    return (
        <NrwMarker
            key={hoveredAdminArea.anchor}
            coordinates={hoveredAdminArea.coordinates}
            placement={getTooltipPlacement(
                { coordinates: hoveredAdminArea.coordinates, anchor: hoveredAdminArea.anchor, map },
            )}
        >
            <div className={styles.adminAreaTooltip}>
                <div className={styles.name}>
                    {hoveredAdminArea.name}
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
