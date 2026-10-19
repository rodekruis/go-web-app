import {
    useContext,
    useMemo,
} from 'react';
import { NumberOutput } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import { mapUnselectedStyle } from '#utils/nrw/colors';
import NrwAdminAreasContext from '#views/CountryProfileNationalRiskWatch/NrwAdminAreasProvider/NrwAdminAreasContext';
import { getFeatureCollectionBounds } from '#views/CountryProfileNationalRiskWatch/utils';

import NrwMarker from '../../NrwMarker';
import { type NrwMarkerPlacement } from '../../NrwMarker/useNrwMapMarker';
import useNrwMapFitBounds from '../../useNrwMapFitBounds';
import useNrwMapLayers from '../useNrwMapLayers';
import getAdminAreaLayer, { getFlatAdminAreaLayer } from './getAdminAreaLayer';
import { type HoveredAdminAreaAnchor } from './useAdminAreaHover';
import useAdminAreaHoverAndDrill from './useAdminAreaHoverAndDrill';

import i18n from './i18n.json';
import styles from './styles.module.css';

// Place the admin area tooltip relative to an anchor point within the area.
const tooltipPlacements: Record<HoveredAdminAreaAnchor, NrwMarkerPlacement> = {
    pointer: { anchor: 'bottom-left', offset: [14, -10] },
    area: { anchor: 'bottom', offset: [0, -10] },
};

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
    } = useContext(NrwAdminAreasContext);

    const strings = useTranslation(i18n);
    const unselectedId = `${id}-unselected`;

    // Fit the map to the admin areas of the level drilled into.
    const bounds = useMemo(
        () => (isDefined(adminAreas) ? getFeatureCollectionBounds(adminAreas) : undefined),
        [adminAreas],
    );
    useNrwMapFitBounds(bounds);

    // The unselected admin areas go first, so they are drawn below the selected ones.
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
    // A click drills down into a selected admin area, or sideways (maybe up) into unselected ones.
    const { hoveredAdminArea: hoveredSelectedAdminArea } = useAdminAreaHoverAndDrill(
        id,
        isInteractive,
        adminAreas,
    );
    const { hoveredAdminArea: hoveredUnselectedAdminArea } = useAdminAreaHoverAndDrill(
        unselectedId,
        isInteractive && isDefined(unselectedAdminAreas),
        unselectedAdminAreas,
    );

    const hoveredAdminArea = hoveredSelectedAdminArea ?? hoveredUnselectedAdminArea;

    if (isNotDefined(hoveredAdminArea) || !isVisible) {
        return null;
    }

    // The grey admin areas can be of several levels, so the tooltip names the level.
    const adminLevelLabel = adminLevelLabels?.[hoveredAdminArea.adminLevel]?.singular;

    return (
        <NrwMarker
            key={hoveredAdminArea.anchor}
            coordinates={hoveredAdminArea.coordinates}
            placement={tooltipPlacements[hoveredAdminArea.anchor]}
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
