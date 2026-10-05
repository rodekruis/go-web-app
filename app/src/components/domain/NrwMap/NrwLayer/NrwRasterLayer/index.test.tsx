import { useMemo } from 'react';
import { render } from '@testing-library/react';
import { type Map as MapboxMap } from 'mapbox-gl-v3';
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    type NrwApiResponse,
    useNrwRequest,
} from '#utils/restRequest';
import createFakeMapboxMap from '#utils/testing/createFakeMapboxMap';
import { type CountryCodeIso3 } from '#views/CountryProfileNationalRiskWatch/types';

import NrwMapContext from '../../NrwMapContext';
import NrwRasterLayer from './index';

vi.mock('#config', () => ({ nrwApi: 'https://nrw.example.org/api/' }));
vi.mock('#utils/restRequest', () => ({ useNrwRequest: vi.fn() }));

type StaticRasterResponse = NrwApiResponse<'/rasters/static/{countryCodeIso3}/{layer}'>;

const malawi = 'MWI' as CountryCodeIso3;

// The coloured extent is in metres (EPSG:3857), so it is wrong for a map
// that wants degrees. Keep it distinct from the data extent.
const floodDepthRaster: StaticRasterResponse = {
    id: 7,
    layer: 'floodDepth',
    metadata: {
        data: {
            crs: 'EPSG:4326',
            nodata: 0,
            extent: {
                xmin: 32.67, xmax: 35.92, ymin: -17.13, ymax: -9.37,
            },
        },
        coloured: {
            crs: 'EPSG:3857',
            extent: {
                xmin: 3636800, xmax: 3998600, ymin: -1938000, ymax: -1049300,
            },
        },
    },
};

function mockRasterResponse(response: StaticRasterResponse | undefined) {
    vi.mocked(useNrwRequest).mockReturnValue({
        response,
        pending: response === undefined,
        error: undefined,
    } as unknown as ReturnType<typeof useNrwRequest>);
}

function RasterHost(props: { map: MapboxMap; isVisible: boolean }) {
    const { map, isVisible } = props;

    const mapContext = useMemo(() => ({ map }), [map]);

    return (
        <NrwMapContext.Provider value={mapContext}>
            <NrwRasterLayer
                id="layer-MWI-floodDepth"
                countryCodeIso3={malawi}
                name="floodDepth"
                isVisible={isVisible}
            />
        </NrwMapContext.Provider>
    );
}

describe('NrwRasterLayer', () => {
    beforeEach(() => {
        vi.mocked(useNrwRequest).mockReset();
    });

    test('requests the static raster metadata of the layer for the country', () => {
        mockRasterResponse(undefined);
        const { map } = createFakeMapboxMap();

        render(<RasterHost map={map} isVisible />);

        expect(useNrwRequest).toHaveBeenCalledWith({
            apiType: 'nrw',
            url: '/rasters/static/{countryCodeIso3}/{layer}',
            pathVariables: { countryCodeIso3: 'MWI', layer: 'floodDepth' },
        });
    });

    test('adds nothing to the map until the metadata arrives', () => {
        mockRasterResponse(undefined);
        const { map, calls, getLayerSpecification } = createFakeMapboxMap();

        const { rerender } = render(<RasterHost map={map} isVisible />);

        expect(calls).toEqual([]);

        mockRasterResponse(floodDepthRaster);
        rerender(<RasterHost map={map} isVisible />);

        expect(getLayerSpecification('layer-MWI-floodDepth')).toBeDefined();
    });

    test('draws the coloured image over the data extent in degrees', () => {
        mockRasterResponse(floodDepthRaster);
        const { map, getLayerSpecification } = createFakeMapboxMap();

        render(<RasterHost map={map} isVisible />);

        expect(getLayerSpecification('layer-MWI-floodDepth')).toEqual({
            id: 'layer-MWI-floodDepth',
            type: 'raster',
            source: {
                type: 'image',
                url: 'https://nrw.example.org/api/rasters/static/MWI/floodDepth/image',
                // Mapbox wants the corners clockwise from the north-west.
                coordinates: [
                    [32.67, -9.37],
                    [35.92, -9.37],
                    [35.92, -17.13],
                    [32.67, -17.13],
                ],
            },
            paint: {
                'raster-resampling': 'nearest',
            },
        });
    });

    test('adds the layer once and toggles its visibility for the same metadata', () => {
        mockRasterResponse(floodDepthRaster);
        const { map, calls, getVisibility } = createFakeMapboxMap();

        const { rerender } = render(<RasterHost map={map} isVisible />);
        expect(getVisibility('layer-MWI-floodDepth')).toBe('visible');

        rerender(<RasterHost map={map} isVisible={false} />);
        expect(getVisibility('layer-MWI-floodDepth')).toBe('none');

        rerender(<RasterHost map={map} isVisible />);
        expect(getVisibility('layer-MWI-floodDepth')).toBe('visible');

        expect(calls.filter((call) => call.startsWith('addLayer'))).toHaveLength(1);
    });
});
