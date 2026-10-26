import {
    useContext,
    useEffect,
    useRef,
} from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import { type MapMouseEvent } from 'mapbox-gl-v3';

import {
    type AdminAreaDrillDownHandler,
    type PlaceCode,
} from '#views/CountryProfileNationalRiskWatch/types';
import { parseAdminAreaProperties } from '#views/CountryProfileNationalRiskWatch/utils';

import NrwMapContext from '../../NrwMapContext';

// Report the topmost admin area clicked in the layers. Clicks beside the admin areas and on
// admin areas that cannot be drilled into are not reported, so the map behaves as
// if there is no click handler there.
function useAdminAreaClick(
    layerIds: string[],
    isEnabled: boolean,
    canDrillDown: (placeCode: PlaceCode) => boolean,
    onClick: AdminAreaDrillDownHandler,
) {
    const { map } = useContext(NrwMapContext);

    // canDrillDown changes identity every render. We don't want to re-register
    // the listener.
    const canDrillDownRef = useRef(canDrillDown);
    useEffect(
        () => {
            canDrillDownRef.current = canDrillDown;
        },
        [canDrillDown],
    );

    useEffect(
        () => {
            if (isNotDefined(map) || !isEnabled) {
                return undefined;
            }

            const handleClick = (event: MapMouseEvent) => {
                const shownLayerIds = layerIds.filter(
                    (layerId) => isDefined(map.getLayer(layerId)),
                );
                if (shownLayerIds.length === 0) {
                    return;
                }

                const [feature] = map.queryRenderedFeatures(event.point, { layers: shownLayerIds });
                const adminArea = parseAdminAreaProperties(feature?.properties);

                if (adminArea === null || !canDrillDownRef.current(adminArea.placeCode)) {
                    // A click that cannot drill down, e.g. on the selected area, does nothing.
                    return;
                }

                onClick(adminArea);
            };

            map.on('click', handleClick);

            return () => {
                map.off('click', handleClick);
            };
        },
        [map, layerIds, isEnabled, onClick],
    );
}

export default useAdminAreaClick;
