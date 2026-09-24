import {
    useContext,
    useEffect,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';
import { type MapMouseEvent } from 'mapbox-gl-v3';

import { type AdminAreaProperties } from '#views/CountryProfileNationalRiskWatch/types';
import { parseAdminAreaProperties } from '#views/CountryProfileNationalRiskWatch/utils';

import NrwMapContext from '../../NrwMapContext';

// Report the admin area clicked in the layer, or null for a click beside them.
function useAdminAreaClick(
    layerId: string,
    isEnabled: boolean,
    onClick: (adminArea: AdminAreaProperties | null) => void,
) {
    const { map } = useContext(NrwMapContext);

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
                onClick(parseAdminAreaProperties(feature?.properties));
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
