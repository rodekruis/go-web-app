import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import { isDefined } from '@togglecorp/fujs';
import type {
    LayerSpecification,
    SourceSpecification,
} from 'mapbox-gl-v3';

import { nrwApi } from '#config';
import { resolveUrl } from '#utils/resolveUrl';
import {
    type NrwApiResponse,
    useNrwRequest,
} from '#utils/restRequest';

import {
    type Latitude,
    type Longitude,
} from '../types';

// Derived types from the API response
type NrwLayer = NrwApiResponse<'/layers'>[number];
type StaticRasterResponse = NrwApiResponse<'/rasters/static/{countryCodeIso3}/{layer}'>;
type NrwHazardType = NrwLayer['hazardType'];
type NrwLayerName = NrwLayer['name'];

interface NrwRasterLayer {
    id: string;
    source: SourceSpecification;
    layer: LayerSpecification;
}

type CoordinateCorners = [
    [Longitude, Latitude],
    [Longitude, Latitude],
    [Longitude, Latitude],
    [Longitude, Latitude],
];

function buildRasterLayer(
    id: string,
    imageUrl: string,
    coordinates: CoordinateCorners,
): NrwRasterLayer {
    return {
        id,
        source: {
            type: 'image',
            url: imageUrl,
            coordinates,
        },
        layer: {
            id,
            type: 'raster',
            source: id,
            paint: {
                'raster-opacity': 0.8,
                'raster-resampling': 'nearest',
            },
        },
    };
}

async function fetchRasterLayer(
    countryCodeIso3: string,
    layerName: NrwLayerName,
): Promise<NrwRasterLayer> {
    const metadataUrl = resolveUrl(
        nrwApi,
        `rasters/static/${countryCodeIso3}/${layerName}`,
    );
    const res = await fetch(metadataUrl);
    if (!res.ok) {
        throw new Error(
            `Failed to load raster metadata for ${layerName} (${res.status})`,
        );
    }
    const json = await res.json() as StaticRasterResponse;
    const { extent } = json.metadata.data;

    const west = extent.xmin as Longitude;
    const south = extent.ymin as Latitude;
    const east = extent.xmax as Longitude;
    const north = extent.ymax as Latitude;

    const id = `layer-${countryCodeIso3}-${layerName}`;
    const imageUrl = resolveUrl(
        nrwApi,
        `rasters/static/${countryCodeIso3}/${layerName}/image`,
    );

    return buildRasterLayer(
        id,
        imageUrl,
        [
            [west, north],
            [east, north],
            [east, south],
            [west, south],
        ],
    );
}

// Pass in the hazard type to get layers specific to that hazard type, or
// pass in nothing/undefined to get all non-event layers
function useNrwLayers(countriesResolved : boolean, hazardType?: NrwHazardType) {
    const skip = !countriesResolved;
    const [loadError, setLoadError] = useState<unknown>(undefined);

    const {
        response,
        error: requestError,
    } = useNrwRequest({
        url: '/layers',
        apiType: 'nrw',
        skip,
        ...(isDefined(hazardType) && {
            query: { hazardType },
        }),
    });

    useEffect(
        () => {
            if (isDefined(response)) {
                // eslint-disable-next-line no-console
                console.log('Available NRW layers', response);
            }
        },
        [response],
    );

    const loadLayer = useCallback(
        async (
            layer: NrwLayer,
            countryCodeIso3: string,
        ): Promise<NrwRasterLayer | undefined> => {
            try {
                if (layer.type === 'raster') {
                    return await fetchRasterLayer(countryCodeIso3, layer.name);
                }
                throw new Error(`Unsupported NRW layer type: ${layer.type}`);
            } catch (err) {
                setLoadError(err);
                return undefined;
            }
        },
        [],
    );

    return {
        layers: response,
        error: requestError ?? loadError,
        loadLayer,
    };
}

export default useNrwLayers;
