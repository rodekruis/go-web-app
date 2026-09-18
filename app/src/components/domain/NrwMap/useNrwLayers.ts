import { isDefined } from '@togglecorp/fujs';

import { useNrwRequest } from '#utils/restRequest';
import {
    type NrwHazardType,
    type NrwLayerName,
    type VisibleLayersChangeHandler,
} from '#views/CountryProfileNationalRiskWatch/types';

const defaultVisibleLayers: NrwLayerName[] = [];

function useNrwLayers(props: {
    urlLayers: NrwLayerName[] | undefined;
    onVisibleLayersChange: VisibleLayersChangeHandler;
    hazardType?: NrwHazardType;
}) {
    const {
        urlLayers,
        onVisibleLayersChange,
        hazardType,
    } = props;

    const { response, error } = useNrwRequest({
        url: '/layers',
        apiType: 'nrw',
        query: isDefined(hazardType) ? { hazardType } : undefined,
    });

    // Layers preference: URL > default.
    const visibleLayers = urlLayers ?? defaultVisibleLayers;

    const handleLayerToggle = (name: NrwLayerName) => {
        onVisibleLayersChange(
            visibleLayers.includes(name)
                ? visibleLayers.filter((visibleName) => visibleName !== name)
                : [...visibleLayers, name],
        );
    };

    return {
        availableLayers: response,
        error,
        visibleLayers,
        handleLayerToggle,
    };
}

export default useNrwLayers;
