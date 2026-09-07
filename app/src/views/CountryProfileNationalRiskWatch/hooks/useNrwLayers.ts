import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import { nrwApi } from '#config';
import { resolveUrl } from '#utils/resolveUrl';
import {
    type NrwApiResponse,
    useNrwLazyRequest,
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

export type CoordinateCorners = [
    [Longitude, Latitude],
    [Longitude, Latitude],
    [Longitude, Latitude],
    [Longitude, Latitude],
];

export interface NrwRasterLayerDetails{
    id: string;
    imageUrl: string;
    coordinates: CoordinateCorners;
}

interface LayerQueryContext {
    countryCodeIso3: string;
    layerName: NrwLayerName;
}

function makeRasterLayerDetails(
    countryCodeIso3: string,
    layerName: NrwLayerName,
    json: StaticRasterResponse,
): NrwRasterLayerDetails {
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

    return {
        id,
        imageUrl,
        coordinates: [
            [west, north],
            [east, north],
            [east, south],
            [west, south],
        ],
    };
}

function appendRasterDetails(
    rasters: NrwRasterLayerDetails[],
    details: NrwRasterLayerDetails,
): NrwRasterLayerDetails[] {
    if (rasters.some((raster) => raster.id === details.id)) {
        return rasters;
    }
    return [...rasters, details];
}

// Pass in the hazard type to get layers specific to that hazard type, or
// pass in nothing/undefined to get all non-event layers
function useNrwLayers(
    countriesResolved: boolean,
    hazardType?: NrwHazardType,
) {
    const [loadError, setLoadError] = useState<unknown>(undefined);
    const [rasters, setRasters] = useState<NrwRasterLayerDetails[]>([]);
    const rasterCacheRef = useRef<Map<string, NrwRasterLayerDetails>>(new Map());

    const skip = !countriesResolved;

    const query = isDefined(hazardType)
        ? { hazardType }
        : undefined;

    const {
        response,
        error: requestError,
    } = useNrwRequest({
        url: '/layers',
        apiType: 'nrw',
        skip,
        query,
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

    const rasterRequest = useNrwLazyRequest<'/rasters/static/{countryCodeIso3}/{layer}', LayerQueryContext>({
        apiType: 'nrw',
        url: '/rasters/static/{countryCodeIso3}/{layer}',
        pathVariables: (context) => ({
            countryCodeIso3: context.countryCodeIso3,
            layer: context.layerName,
        }),
        onSuccess: (json, context) => {
            const details = makeRasterLayerDetails(
                context.countryCodeIso3,
                context.layerName,
                json,
            );
            rasterCacheRef.current.set(details.id, details);
            setRasters((prev) => appendRasterDetails(prev, details));
        },
        onFailure: (error) => {
            setLoadError(error);
        },
    });

    const loadLayer = useCallback(
        (
            layer: NrwLayer,
            countryCodeIso3: string,
        ) => {
            if (layer.type !== 'raster') {
                setLoadError(new Error(`Unsupported NRW layer type: ${layer.type}`));
                return;
            }
            const cacheKey = `layer-${countryCodeIso3}-${layer.name}`;
            if (rasterCacheRef.current.has(cacheKey)) {
                return;
            }
            rasterRequest.trigger({ countryCodeIso3, layerName: layer.name });
        },
        [rasterRequest],
    );

    return {
        layers: response,
        rasters,
        error: requestError ?? loadError,
        loadLayer,
    };
}

export default useNrwLayers;
