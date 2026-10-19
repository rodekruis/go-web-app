import {
    useContext,
    useEffect,
    useRef,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';
import { type MapMouseEvent } from 'mapbox-gl-v3';

import {
    type AdminAreaDrillDownHandler,
    type AdminAreaProperties,
} from '#views/CountryProfileNationalRiskWatch/types';
import { parseAdminAreaProperties } from '#views/CountryProfileNationalRiskWatch/utils';

import NrwMapContext from '../../NrwMapContext';

// Report the admin area clicked in the layer. Clicks beside the admin areas and on
// admin areas that cannot be drilled into are not reported, so the map behaves as
// if there is no click handler there.
function useAdminAreaClick(
    layerId: string,
    isEnabled: boolean,
    canDrillDown: (adminArea: AdminAreaProperties) => boolean,
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
                if (isNotDefined(map.getLayer(layerId))) {
                    return;
                }

                const [feature] = map.queryRenderedFeatures(event.point, { layers: [layerId] });
                const adminArea = parseAdminAreaProperties(feature?.properties);

                if (adminArea === null || !canDrillDownRef.current(adminArea)) {
                    // When we click the lowest admin area: we don't want anything to happen.
                    return;
                }

                onClick(adminArea);
            };

            map.on('click', handleClick);

            return () => {
                map.off('click', handleClick);
            };
        },
        [map, layerId, isEnabled, onClick],
    );
}

export default useAdminAreaClick;
