import { useMemo } from 'react';
import { isNotDefined } from '@togglecorp/fujs';

import { nrwApi } from '#config';
import { resolveUrl } from '#utils/resolveUrl';
import { useNrwRequest } from '#utils/restRequest';
import {
    type CountryCodeIso3,
    type NrwLayer,
} from '#views/CountryProfileNationalRiskWatch/types';

import useNrwMapLayer from '../useNrwMapLayer';

function NrwRasterLayer(props: {
    id: string;
    countryCodeIso3: CountryCodeIso3;
    name: NrwLayer['name'];
    resourceId?: string;
    isVisible: boolean;
    beforeId?: string;
}) {
    const {
        id, countryCodeIso3, name, resourceId, isVisible, beforeId,
    } = props;

    const { response: staticRaster } = useNrwRequest({
        apiType: 'nrw',
        url: '/rasters/static/{countryCodeIso3}/{layer}',
        pathVariables: {
            countryCodeIso3,
            layer: name,
        },
        skip: !isNotDefined(resourceId),
    });

    const { response: alertRaster } = useNrwRequest({
        apiType: 'nrw',
        url: '/rasters/alert/{id}',
        pathVariables: { id: Number(resourceId) },
        skip: isNotDefined(resourceId),
    });

    const response = isNotDefined(resourceId) ? staticRaster : alertRaster;

    const mapLayer = useMemo<Parameters<typeof useNrwMapLayer>[0]>(
        () => {
            if (isNotDefined(response)) {
                return undefined;
            }

            const {
                xmin, ymin, xmax, ymax,
            } = response.metadata.data.extent;

            return {
                id,
                type: 'raster',
                source: {
                    type: 'image',
                    url: resolveUrl(
                        nrwApi,
                        isNotDefined(resourceId)
                            ? `rasters/static/${countryCodeIso3}/${name}/image`
                            : `rasters/alert/${resourceId}/image`,
                    ),
                    coordinates: [
                        [xmin, ymax], // west north
                        [xmax, ymax], // east north
                        [xmax, ymin], // east south
                        [xmin, ymin], // west south
                    ],
                },
                paint: {
                    'raster-resampling': 'nearest',
                },
            };
        },
        [id, countryCodeIso3, name, resourceId, response],
    );

    useNrwMapLayer(mapLayer, isVisible, beforeId);

    return null;
}

export default NrwRasterLayer;
