import {
    useCallback,
    useRef,
    useState,
} from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import { nrwApi } from '#config';
import { resolveUrl } from '#utils/resolveUrl';
import {
    type NrwApiResponse,
    useNrwRequest,
} from '#utils/restRequest';

import {
    type CountryCodeIso3,
    type Latitude,
    type Longitude,
} from '../types';

// Derived types from the API response
type NrwLayer = NrwApiResponse<'/layers'>[number];
type StaticRasterResponse = NrwApiResponse<'/rasters/static/{countryCodeIso3}/{layer}'>;
type NrwHazardType = NrwLayer['hazardType'];
export type NrwLayerName = NrwLayer['name'];

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

interface LayerRequest {
    id: string;
    countryCodeIso3: CountryCodeIso3;
    layerName: NrwLayerName;
}

function makeRasterLayerDetails(
    layerRequest: LayerRequest,
    json: StaticRasterResponse,
): NrwRasterLayerDetails {
    const { id, countryCodeIso3, layerName } = layerRequest;
    const {
        xmin, ymin, xmax, ymax,
    } = json.metadata.data.extent;

    const west = xmin as Longitude;
    const south = ymin as Latitude;
    const east = xmax as Longitude;
    const north = ymax as Latitude;

    return {
        id,
        imageUrl: resolveUrl(nrwApi, `rasters/static/${countryCodeIso3}/${layerName}/image`),
        coordinates: [
            [west, north],
            [east, north],
            [east, south],
            [west, south],
        ],
    };
}

// Pass a hazard type to get the available layers for that hazard,
// or leave it undefined to get all non-event layers.
function useNrwLayers(hazardType?: NrwHazardType) {
    const [rasterLayerDetails, setRasterLayerDetails] = useState<NrwRasterLayerDetails[]>([]);
    const [requestQueue, setRequestQueue] = useState<LayerRequest[]>([]);
    const [queueIndex, setQueueIndex] = useState(0);
    const [loadError, setLoadError] = useState<unknown>(undefined);
    const requestedIdsRef = useRef<Set<string>>(new Set());

    // Fetch the list of available layers
    const {
        response: availableLayers,
        error: layersError,
    } = useNrwRequest({
        url: '/layers',
        apiType: 'nrw',
        query: isDefined(hazardType) ? { hazardType } : undefined,
    });

    // Use a request queue to load data one after another
    const nextRequest = requestQueue[queueIndex];

    useNrwRequest({
        apiType: 'nrw',
        url: '/rasters/static/{countryCodeIso3}/{layer}',
        skip: isNotDefined(nextRequest),
        pathVariables: isDefined(nextRequest)
            ? { countryCodeIso3: nextRequest.countryCodeIso3, layer: nextRequest.layerName }
            : undefined,
        onSuccess: (json) => {
            if (isDefined(nextRequest)) {
                setRasterLayerDetails((prev) => [
                    ...prev,
                    makeRasterLayerDetails(nextRequest, json),
                ]);
            }
            setQueueIndex((prev) => prev + 1);
        },
        onFailure: (error) => {
            setLoadError(error);
            setQueueIndex((prev) => prev + 1);
        },
    });

    const loadLayer = useCallback(
        (countryCodeIso3: CountryCodeIso3, layerName: NrwLayerName) => {
            const id = `layer-${countryCodeIso3}-${layerName}`;
            // Requesting the same layer twice is a no-op, so callers can call this freely.
            if (requestedIdsRef.current.has(id)) {
                return;
            }
            requestedIdsRef.current.add(id);
            setRequestQueue((prev) => [...prev, { id, countryCodeIso3, layerName }]);
        },
        [],
    );

    return {
        availableLayers,
        rasterLayerDetails,
        loadLayer,
        error: layersError ?? loadError,
    };
}

export default useNrwLayers;
