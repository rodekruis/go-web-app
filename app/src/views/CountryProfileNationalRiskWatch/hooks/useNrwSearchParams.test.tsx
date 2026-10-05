import {
    type ReactNode,
    useState,
} from 'react';
import {
    createBrowserRouter,
    RouterProvider,
    useLocation,
    useNavigationType,
} from 'react-router-dom';
import {
    act,
    renderHook,
} from '@testing-library/react';
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import useCountry from '#hooks/domain/useCountry';

import {
    type Latitude,
    type Longitude,
    type Zoom,
} from '../types';
import useNrwSearchParams from './useNrwSearchParams';

const config = vi.hoisted(() => ({ nrwStandalone: true }));

vi.mock('#config', () => config);
vi.mock('#hooks/domain/useCountry', () => ({ default: vi.fn() }));

// Renders the hook at the given url, next to the location so a test can read
// whether the hook navigated and how. The hook writes from window.location, so
// the router is the browser data router of the app, not a memory router.
function renderNrwSearchParams(url: string) {
    window.history.replaceState(null, '', url);

    function Wrapper(props: { children: ReactNode }) {
        const { children } = props;

        // The router keeps the children of the first render; do not rerender.
        const [router] = useState(() => createBrowserRouter([
            { path: '/', element: children },
            { path: '/countries/:countryId', element: children },
        ]));

        return <RouterProvider router={router} />;
    }

    const { result } = renderHook(
        () => ({
            params: useNrwSearchParams(),
            location: useLocation(),
            navigationType: useNavigationType(),
        }),
        { wrapper: Wrapper },
    );

    return {
        result,
        get searchParams() {
            return new URLSearchParams(window.location.search);
        },
    };
}

describe('useNrwSearchParams', () => {
    beforeEach(() => {
        config.nrwStandalone = true;
        vi.mocked(useCountry).mockReset();
    });

    describe('layers', () => {
        test('shows no layers when the url names none that is supported', () => {
            expect(renderNrwSearchParams('/').result.current.params.layersFromUrlParams)
                .toEqual([]);
            expect(renderNrwSearchParams('/?layers=').result.current.params.layersFromUrlParams)
                .toEqual([]);
            expect(renderNrwSearchParams('/?layers=%20').result.current.params.layersFromUrlParams)
                .toEqual([]);
            expect(
                renderNrwSearchParams('/?layers=notALayer').result.current.params.layersFromUrlParams,
            ).toEqual([]);
        });

        test('keeps the supported layer names only, in the panel order', () => {
            const { result } = renderNrwSearchParams(
                '/?layers=clinics,windSpeed,%20floodDepth%20,notALayer,clinics',
            );

            expect(result.current.params.layersFromUrlParams).toEqual(['floodDepth', 'clinics']);
        });

        test('writes the visible layers to the url and keeps the other parameters', () => {
            const rendered = renderNrwSearchParams('/?z=5&countries=MWI');

            act(() => {
                rendered.result.current.params.setLayersFromUrlParams(['floodDepth', 'clinics']);
            });

            // A toggle must not add a history entry, or the back button steps through them.
            expect(rendered.result.current.navigationType).toBe('REPLACE');
            expect(rendered.searchParams.get('layers')).toBe('floodDepth,clinics');
            expect(rendered.searchParams.get('z')).toBe('5');
            expect(rendered.searchParams.get('countries')).toBe('MWI');
            expect(rendered.result.current.params.layersFromUrlParams)
                .toEqual(['floodDepth', 'clinics']);
        });

        test('removes the layers parameter when no layer is visible', () => {
            const rendered = renderNrwSearchParams('/?layers=clinics');

            act(() => {
                rendered.result.current.params.setLayersFromUrlParams([]);
            });

            expect(rendered.searchParams.has('layers')).toBe(false);
            expect(rendered.result.current.params.layersFromUrlParams).toEqual([]);
        });

        test('reads the layers back in the panel order, whatever the toggle order', () => {
            const rendered = renderNrwSearchParams('/');

            act(() => {
                rendered.result.current.params.setLayersFromUrlParams(['clinics', 'floodDepth']);
            });

            expect(rendered.result.current.params.layersFromUrlParams)
                .toEqual(['floodDepth', 'clinics']);
        });
    });

    describe('map view', () => {
        test('reads the zoom and the centre from the url', () => {
            const { result } = renderNrwSearchParams('/?z=5.5&lat=-13.25&lon=34.3');

            expect(result.current.params.zoomFromUrlParams).toBe(5.5);
            expect(result.current.params.latitudeFromUrlParams).toBe(-13.25);
            expect(result.current.params.longitudeFromUrlParams).toBe(34.3);
        });

        test('rejects a zoom or a centre out of range', () => {
            const { result } = renderNrwSearchParams('/?z=24.1&lat=90.5&lon=-180.5');

            expect(result.current.params.zoomFromUrlParams).toBeNull();
            expect(result.current.params.latitudeFromUrlParams).toBeNull();
            expect(result.current.params.longitudeFromUrlParams).toBeNull();
        });

        test('accepts a zoom and a centre on the range limits', () => {
            const low = renderNrwSearchParams('/?z=0&lat=-90&lon=-180').result.current.params;
            const high = renderNrwSearchParams('/?z=24&lat=90&lon=180').result.current.params;

            expect([low.zoomFromUrlParams, low.latitudeFromUrlParams, low.longitudeFromUrlParams])
                .toEqual([0, -90, -180]);
            expect([
                high.zoomFromUrlParams,
                high.latitudeFromUrlParams,
                high.longitudeFromUrlParams,
            ]).toEqual([24, 90, 180]);
        });

        test('rejects a zoom or a centre that is not a finite number', () => {
            const { result } = renderNrwSearchParams('/?z=&lat=abc&lon=Infinity');

            expect(result.current.params.zoomFromUrlParams).toBeNull();
            expect(result.current.params.latitudeFromUrlParams).toBeNull();
            expect(result.current.params.longitudeFromUrlParams).toBeNull();
        });

        test('writes the map view with a 2 decimal zoom and 6 decimal coordinates', () => {
            const rendered = renderNrwSearchParams('/?layers=clinics');

            act(() => {
                rendered.result.current.params.handleMapViewChange(
                    5.126 as Zoom,
                    -13.1234567 as Latitude,
                    34.98765449 as Longitude,
                );
            });

            expect(rendered.result.current.navigationType).toBe('REPLACE');
            expect(rendered.searchParams.get('z')).toBe('5.13');
            expect(rendered.searchParams.get('lat')).toBe('-13.123457');
            expect(rendered.searchParams.get('lon')).toBe('34.987654');
            expect(rendered.searchParams.get('layers')).toBe('clinics');
        });
    });

    describe('selected event', () => {
        test('reads a positive integer event id only', () => {
            expect(renderNrwSearchParams('/?event=42').result.current.params.selectedEventId)
                .toBe(42);
            expect(renderNrwSearchParams('/?event=0').result.current.params.selectedEventId)
                .toBeUndefined();
            expect(renderNrwSearchParams('/?event=-1').result.current.params.selectedEventId)
                .toBeUndefined();
            expect(renderNrwSearchParams('/?event=1.5').result.current.params.selectedEventId)
                .toBeUndefined();
            expect(renderNrwSearchParams('/?event=abc').result.current.params.selectedEventId)
                .toBeUndefined();
        });

        test('selecting an event shows the default layers and drops the map view', () => {
            const rendered = renderNrwSearchParams(
                '/?countries=MWI&z=6.50&lat=-13.250000&lon=34.300000&layers=clinics',
            );
            const locationKey = rendered.result.current.location.key;

            act(() => {
                rendered.result.current.params.handleSelectedEventIdChange(42);
            });

            expect(rendered.result.current.location.key).not.toBe(locationKey);
            expect(rendered.result.current.navigationType).toBe('REPLACE');
            expect(rendered.searchParams.get('event')).toBe('42');
            expect(rendered.searchParams.get('layers')).toBe('exposedPopulation');
            expect(rendered.searchParams.has('z')).toBe(false);
            expect(rendered.searchParams.has('lat')).toBe(false);
            expect(rendered.searchParams.has('lon')).toBe(false);
            expect(rendered.searchParams.get('countries')).toBe('MWI');
            expect(rendered.result.current.params.selectedEventId).toBe(42);
            expect(rendered.result.current.params.layersFromUrlParams)
                .toEqual(['exposedPopulation']);
        });

        test('selecting a flood event also shows the flood depth layer', () => {
            const rendered = renderNrwSearchParams('/?countries=MWI&layers=clinics');

            act(() => {
                rendered.result.current.params.handleSelectedEventIdChange(42, 'floods');
            });

            expect(rendered.searchParams.get('layers')).toBe('exposedPopulation,floodDepth');
            expect(rendered.result.current.params.layersFromUrlParams)
                .toEqual(['exposedPopulation', 'floodDepth']);
        });

        test('clearing the event hides all layers and drops the map view', () => {
            const rendered = renderNrwSearchParams(
                '/?countries=MWI&event=42&layers=exposedPopulation&z=5&lat=-13&lon=34',
            );

            act(() => {
                rendered.result.current.params.handleSelectedEventIdChange(undefined);
            });

            expect(rendered.result.current.navigationType).toBe('REPLACE');
            expect(Array.from(rendered.searchParams.keys())).toEqual(['countries']);
            expect(rendered.result.current.params.selectedEventId).toBeUndefined();
            expect(rendered.result.current.params.layersFromUrlParams).toEqual([]);
        });

        test('selecting the selected event again does not navigate', () => {
            const rendered = renderNrwSearchParams('/?event=42&z=5&lat=-13&lon=34');
            const locationKey = rendered.result.current.location.key;

            act(() => {
                rendered.result.current.params.handleSelectedEventIdChange(42);
            });

            expect(rendered.result.current.location.key).toBe(locationKey);
            expect(rendered.searchParams.get('z')).toBe('5');
        });

        test('a map view change after selecting an event keeps the event and its layers', () => {
            const rendered = renderNrwSearchParams('/?countries=MWI');

            act(() => {
                rendered.result.current.params.handleSelectedEventIdChange(1);
            });
            // The fit-bounds animation after a selection ends with a "moveend", so
            // this write must build on the url that the selection wrote.
            act(() => {
                rendered.result.current.params.handleMapViewChange(
                    7.14 as Zoom,
                    -15.314335 as Latitude,
                    35.083364 as Longitude,
                );
            });

            expect(Array.from(rendered.searchParams.keys()).sort())
                .toEqual(['countries', 'event', 'lat', 'layers', 'lon', 'z']);
            expect(rendered.searchParams.get('event')).toBe('1');
            expect(rendered.searchParams.get('layers')).toBe('exposedPopulation');
            expect(rendered.searchParams.get('z')).toBe('7.14');
            expect(rendered.result.current.params.selectedEventId).toBe(1);
        });

        test('a map view change from before the event was unselected keeps it unselected', () => {
            const rendered = renderNrwSearchParams('/?countries=MWI');

            act(() => {
                rendered.result.current.params.handleSelectedEventIdChange(1);
            });

            // The map container keeps the handler of an earlier render in a ref, so
            // the "moveend" at the end of a fit-bounds animation can call this one.
            const { handleMapViewChange } = rendered.result.current.params;

            act(() => {
                rendered.result.current.params.handleSelectedEventIdChange(undefined);
            });
            act(() => {
                handleMapViewChange(7.14 as Zoom, -15.314335 as Latitude, 35.083364 as Longitude);
            });

            expect(Array.from(rendered.searchParams.keys()).sort())
                .toEqual(['countries', 'lat', 'lon', 'z']);
            expect(rendered.searchParams.get('z')).toBe('7.14');
            expect(rendered.searchParams.get('lat')).toBe('-15.314335');
            expect(rendered.searchParams.get('lon')).toBe('35.083364');
            expect(rendered.searchParams.get('countries')).toBe('MWI');
            expect(rendered.result.current.params.selectedEventId).toBeUndefined();
        });
    });

    describe('countries', () => {
        test('standalone: reads the valid country codes from the url', () => {
            const { result } = renderNrwSearchParams('/?countries=mwi,%20KEN%20,XX,1234,');

            expect(result.current.params.urlCountries).toEqual(['MWI', 'KEN']);
        });

        test('standalone: has no countries when the url names none', () => {
            expect(renderNrwSearchParams('/').result.current.params.urlCountries).toEqual([]);
        });

        test('embedded: takes the country of the route once it is known', () => {
            config.nrwStandalone = false;
            const { result } = renderNrwSearchParams('/countries/123?countries=KEN');

            expect(useCountry).toHaveBeenCalledWith({ id: 123 });
            expect(result.current.params.urlCountries).toBeUndefined();

            vi.mocked(useCountry).mockReturnValue(
                { iso3: 'MWI' } as ReturnType<typeof useCountry>,
            );
            const known = renderNrwSearchParams('/countries/123?countries=KEN');

            expect(known.result.current.params.urlCountries).toEqual(['MWI']);
        });
    });
});
