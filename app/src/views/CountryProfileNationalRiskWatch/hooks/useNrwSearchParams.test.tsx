import {
    act,
    useEffect,
} from 'react';
import {
    createRoot,
    type Root,
} from 'react-dom/client';
import {
    createBrowserRouter,
    RouterProvider,
} from 'react-router-dom';
import {
    afterEach,
    expect,
    test,
} from 'vitest';

import DomainContext, { type Domain } from '#contexts/domain';

import {
    type Latitude,
    type Longitude,
    type NrwEvent,
    type Zoom,
} from '../types';
import useNrwSearchParams from './useNrwSearchParams';

type NrwSearchParams = ReturnType<typeof useNrwSearchParams>;

// React only flushes updates inside act() when this flag is set.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const domain: Domain = {
    register: () => {},
    invalidate: () => {},
};

let root: Root | undefined;
let container: HTMLDivElement | undefined;
let latest: NrwSearchParams | undefined;

function Probe(props: { onRender: (result: NrwSearchParams) => void }) {
    const { onRender } = props;
    const result = useNrwSearchParams();

    useEffect(() => {
        onRender(result);
    });

    return null;
}

function nrwSearchParams() {
    if (!latest) {
        throw new Error('useNrwSearchParams has not rendered');
    }
    return latest;
}

async function renderHook(search: string) {
    window.history.replaceState(null, '', `/${search}`);
    const router = createBrowserRouter([{
        path: '*',
        element: <Probe onRender={(result) => { latest = result; }} />,
    }]);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
        root?.render(
            <DomainContext.Provider value={domain}>
                <RouterProvider router={router} />
            </DomainContext.Provider>,
        );
    });
}

afterEach(async () => {
    await act(async () => {
        root?.unmount();
    });
    container?.remove();
    root = undefined;
    container = undefined;
    latest = undefined;
});

test('selecting and unselecting an event updates the URL', async () => {
    await renderHook('?countries=MWI&z=6.50&lat=-13.250000&lon=34.300000');

    await act(async () => {
        nrwSearchParams().handleSelectedEventIdChange(1 as NrwEvent['eventId']);
    });
    expect(window.location.search).toBe('?countries=MWI&event=1&layers=exposedPopulation');
    expect(nrwSearchParams().selectedEventId).toBe(1);

    await act(async () => {
        nrwSearchParams().handleSelectedEventIdChange(undefined);
    });
    expect(window.location.search).toBe('?countries=MWI');
    expect(nrwSearchParams().selectedEventId).toBeUndefined();
});

test('a map view change from before the event was unselected keeps it unselected', async () => {
    await renderHook('?countries=MWI');

    await act(async () => {
        nrwSearchParams().handleSelectedEventIdChange(1 as NrwEvent['eventId']);
    });

    // The map container keeps the handler of an earlier render in a ref, so
    // the "moveend" at the end of a fit-bounds animation can call this one.
    const { handleMapViewChange } = nrwSearchParams();

    await act(async () => {
        nrwSearchParams().handleSelectedEventIdChange(undefined);
    });
    expect(window.location.search).toBe('?countries=MWI');

    await act(async () => {
        handleMapViewChange(7.14 as Zoom, -15.314335 as Latitude, 35.083364 as Longitude);
    });
    expect(window.location.search).toBe('?countries=MWI&z=7.14&lat=-15.314335&lon=35.083364');
    expect(nrwSearchParams().selectedEventId).toBeUndefined();
});
