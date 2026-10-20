import {
    useCallback,
    useContext,
} from 'react';

import NrwAdminAreasContext from '#views/CountryProfileNationalRiskWatch/NrwAdminAreasProvider/NrwAdminAreasContext';
import {
    type AdminAreaProperties,
    type NrwAdminAreaFeatureCollection,
} from '#views/CountryProfileNationalRiskWatch/types';

import useAdminAreaClick from './useAdminAreaClick';
import useAdminAreaHover from './useAdminAreaHover';

// Hover and drill on click for one admin area layer.
function useAdminAreaHoverAndDrill(
    layerId: string,
    isEnabled: boolean,
    adminAreas: NrwAdminAreaFeatureCollection | undefined,
) {
    const {
        pending,
        hoveredPlaceCode,
        onAdminAreaHoverChange,
        canDrillDown,
        drillDown,
    } = useContext(NrwAdminAreasContext);

    const { hoveredAdminArea, clearHover } = useAdminAreaHover(
        layerId,
        isEnabled,
        adminAreas,
        hoveredPlaceCode,
        onAdminAreaHoverChange,
        canDrillDown,
    );

    const handleClick = useCallback(
        (adminArea: AdminAreaProperties) => {
            clearHover();
            drillDown(adminArea);
        },
        [drillDown, clearHover],
    );
    // The last level stays on the map while the next loads, so hold clicks until then.
    useAdminAreaClick(layerId, isEnabled && !pending, canDrillDown, handleClick);

    return { hoveredAdminArea };
}

export default useAdminAreaHoverAndDrill;
