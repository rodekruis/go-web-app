import {
    useCallback,
    useMemo,
} from 'react';
import { NumberOutput } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import useNrwAdminAreas from '#views/CountryProfileNationalRiskWatch/hooks/useNrwAdminAreas';
import {
    type AdminAreaProperties,
    type CountryCodeIso3,
    type NrwEvent,
} from '#views/CountryProfileNationalRiskWatch/types';
import { getFeatureCollectionBounds } from '#views/CountryProfileNationalRiskWatch/utils';

import NrwMarker from '../../NrwMarker';
import { type NrwMarkerPlacement } from '../../NrwMarker/useNrwMapMarker';
import useNrwMapFitBounds from '../../useNrwMapFitBounds';
import useNrwMapLayer from '../useNrwMapLayer';
import getAdminAreaFillLayer from './getAdminAreaFillLayer';
import useAdminAreaClick from './useAdminAreaClick';
import useAdminAreaDrill from './useAdminAreaDrill';
import useAdminAreaHover from './useAdminAreaHover';

import i18n from './i18n.json';
import styles from './styles.module.css';

// Show the tooltip just above-right of the pointer, as in the prototype.
const tooltipPlacement: NrwMarkerPlacement = { anchor: 'bottom-left', offset: [14, -10] };

function NrwShapeLayer(props: {
    id: string;
    countryCodeIso3: CountryCodeIso3;
    // The ramp hue follows the alert class of the selected event.
    alertClass: NrwEvent['alertClass'];
    isVisible: boolean;
}) {
    const {
        id, countryCodeIso3, alertClass, isVisible,
    } = props;

    const strings = useTranslation(i18n);

    const {
        adminLevel,
        parentPlaceCode,
        drillDown,
        drillUp,
        handleAdminAreasSuccess,
    } = useAdminAreaDrill(countryCodeIso3);

    const { adminAreas } = useNrwAdminAreas({
        countries: [countryCodeIso3],
        adminLevel,
        parentPlaceCode,
        skip: !countryCodeIso3,
        onSuccess: handleAdminAreasSuccess,
    });

    // Fit the map to the admin areas of the level drilled into.
    const bounds = useMemo(
        () => (isDefined(adminAreas) ? getFeatureCollectionBounds(adminAreas) : undefined),
        [adminAreas],
    );
    useNrwMapFitBounds(bounds);

    const mapLayer = useMemo(
        () => (isDefined(adminAreas)
            ? getAdminAreaFillLayer(id, adminAreas, alertClass)
            : undefined),
        [id, adminAreas, alertClass],
    );
    useNrwMapLayer(mapLayer, isVisible);

    const isInteractive = isDefined(mapLayer) && isVisible;
    const { hoveredAdminArea, clearHover } = useAdminAreaHover(id, isInteractive);

    // Drill into the clicked admin area, or back up on a click beside them.
    const handleClick = useCallback(
        (adminArea: AdminAreaProperties | null) => {
            if (adminArea === null) {
                drillUp();
                return;
            }

            clearHover();
            drillDown(adminArea.placeCode);
        },
        [drillDown, drillUp, clearHover],
    );
    useAdminAreaClick(id, isInteractive, handleClick);

    if (isNotDefined(hoveredAdminArea) || !isVisible) {
        return null;
    }

    return (
        <NrwMarker
            coordinates={hoveredAdminArea.coordinates}
            placement={tooltipPlacement}
        >
            <div className={styles.adminAreaTooltip}>
                <div className={styles.name}>
                    {hoveredAdminArea.name}
                </div>
                <div className={styles.population}>
                    {strings.nrwShapeLayerPopulationLabel}
                    <NumberOutput
                        className={styles.value}
                        value={hoveredAdminArea.population}
                        invalidText="--"
                    />
                </div>
            </div>
        </NrwMarker>
    );
}

export default NrwShapeLayer;
