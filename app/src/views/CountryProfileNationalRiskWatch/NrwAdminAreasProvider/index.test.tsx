import {
    act,
    useContext,
    useEffect,
    useState,
} from 'react';
import {
    createRoot,
    type Root,
} from 'react-dom/client';
import {
    afterEach,
    beforeEach,
    expect,
    test,
    vi,
} from 'vitest';

import supportedLayerNames from '#utils/nrw/layers';

import {
    type AdminAreaProperties,
    type AdminLevel,
    type NrwAdminAreaFeatureCollection,
    type NrwEvent,
    type NrwExposedAdminArea,
    type PlaceCode,
    type PlaceCodeChangeHandler,
} from '../types';
import NrwAdminAreasContext, { type NrwAdminAreasContextProps } from './NrwAdminAreasContext';
import NrwAdminAreasProvider from '.';

// React only flushes updates inside act() when this flag is set.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The requests are faked. The test reads the latest /admin-areas request and
// answers it, as the server would.
interface AdminAreasRequest {
    url: string;
    skip?: boolean;
    query?: { filter: string };
    onSuccess?: (adminAreas: NrwAdminAreaFeatureCollection) => void;
    onFailure?: () => void;
}

let adminAreasRequest: AdminAreasRequest | undefined;

vi.mock('#utils/restRequest', () => ({
    useNrwRequest: (request: AdminAreasRequest) => {
        if (request.url === '/admin-areas') {
            adminAreasRequest = request;
        }
        return { response: undefined, pending: false, error: undefined };
    },
}));

function requestedFilter() {
    if (!adminAreasRequest || adminAreasRequest.skip) {
        return undefined;
    }
    return adminAreasRequest.query?.filter;
}

function createArea(placeCode: string, name: string): NrwExposedAdminArea {
    return {
        placeCode,
        name,
        adminLevel: placeCode.length - 2,
        exposure: [{ layerName: supportedLayerNames.exposedPopulation, total: null, exposed: 1 }],
    };
}

// Two states, each with counties, one of which has payams.
const event = {
    eventId: 8,
    countryCodeIso3: 'SSD',
    exposedAdminAreas: {
        0: [createArea('SS', 'South Sudan')],
        1: [createArea('SS03', 'Jonglei'), createArea('SS04', 'Lakes')],
        2: [createArea('SS0303', 'Bor South'), createArea('SS0401', 'Awerial')],
        3: [createArea('SS030301', 'Bor')],
    },
} as unknown as NrwEvent;

const jonglei: AdminAreaProperties = {
    adminLevel: 1 as AdminLevel,
    placeCode: 'SS03' as PlaceCode,
    name: 'Jonglei',
};
const borSouth: AdminAreaProperties = {
    adminLevel: 2 as AdminLevel,
    placeCode: 'SS0303' as PlaceCode,
    name: 'Bor South',
};

// One state with two counties, so the drill starts at the counties.
const eventSplitAtCounties = {
    ...event,
    eventId: 9,
    exposedAdminAreas: {
        0: [createArea('SS', 'South Sudan')],
        1: [createArea('SS03', 'Jonglei')],
        2: [createArea('SS0303', 'Bor South'), createArea('SS0304', 'Twic East')],
        3: [createArea('SS030301', 'Bor')],
    },
} as unknown as NrwEvent;

const noAdminAreas = {
    type: 'FeatureCollection',
    features: [],
} as unknown as NrwAdminAreaFeatureCollection;

// One admin area of the level below the given drill path, with the place
// codes of its parents, as the server returns them.
function adminAreasBelow(...path: AdminAreaProperties[]): NrwAdminAreaFeatureCollection {
    const properties = {
        adminLevel: (path.at(-1)?.adminLevel ?? 0) + 1,
        ...Object.fromEntries(path.map(
            (adminArea) => [`placeCodeLevel${adminArea.adminLevel}`, adminArea.placeCode],
        )),
    };

    return {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: null, properties }],
    } as unknown as NrwAdminAreaFeatureCollection;
}

const states = adminAreasBelow();
const jongleiCounties = adminAreasBelow(jonglei);
const borSouthPayams = adminAreasBelow(jonglei, borSouth);

let root: Root | undefined;
let container: HTMLDivElement | undefined;
let latest: NrwAdminAreasContextProps | undefined;

// Stands in for the url, which keeps the admin area drilled into.
let url: { placeCode: PlaceCode | undefined; set: PlaceCodeChangeHandler } | undefined;

function Probe() {
    const value = useContext(NrwAdminAreasContext);

    useEffect(() => {
        latest = value;
    });

    return null;
}

function Harness(props: { event: NrwEvent | undefined }) {
    const { event: renderedEvent } = props;
    const [placeCode, setPlaceCode] = useState<PlaceCode>();

    useEffect(() => {
        url = { placeCode, set: setPlaceCode };
    }, [placeCode]);

    return (
        <NrwAdminAreasProvider
            event={renderedEvent}
            urlPlaceCode={placeCode}
            onUrlPlaceCodeChange={setPlaceCode}
        >
            <Probe />
        </NrwAdminAreasProvider>
    );
}

function adminAreas() {
    if (!latest) {
        throw new Error('NrwAdminAreasProvider has not rendered');
    }
    return latest;
}

async function render(renderedEvent: NrwEvent | undefined) {
    if (!root) {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    }
    await act(async () => {
        root?.render(<Harness event={renderedEvent} />);
    });
}

// Select an event as the view does: it also clears the admin area from the url.
async function selectEvent(renderedEvent: NrwEvent | undefined) {
    await act(async () => {
        url?.set(undefined);
        root?.render(<Harness event={renderedEvent} />);
    });
}

// Open a link to an admin area of the event.
async function openUrl(placeCode: string | undefined) {
    await act(async () => {
        url?.set(placeCode as PlaceCode | undefined);
    });
}

async function drillDown(adminArea: AdminAreaProperties) {
    await act(async () => {
        adminAreas().drillDown(adminArea);
    });
}

async function drillUp() {
    await act(async () => {
        adminAreas().drillUp();
    });
}

async function drillUpTo(adminLevel: number) {
    await act(async () => {
        adminAreas().drillUpTo(adminLevel as AdminLevel);
    });
}

async function answer(response: NrwAdminAreaFeatureCollection | undefined) {
    await act(async () => {
        if (response) {
            adminAreasRequest?.onSuccess?.(response);
        } else {
            adminAreasRequest?.onFailure?.();
        }
    });
}

beforeEach(async () => {
    await render(event);
});

afterEach(async () => {
    await act(async () => {
        root?.unmount();
    });
    container?.remove();
    root = undefined;
    container = undefined;
    latest = undefined;
    url = undefined;
    adminAreasRequest = undefined;
});

test('opens at the first level with several exposed areas', () => {
    expect(adminAreas().initialAdminLevel).toBe(1);
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().drillPath).toEqual([]);
    expect(adminAreas().parentAdminArea).toBeUndefined();
    expect(adminAreas().adminAreas).toBeUndefined();
    expect(adminAreas().canDrillDown(jonglei.placeCode)).toBe(true);
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=1 AND placeCode IN ('SS03','SS04')");
});

test('shows the next level only once its admin areas have loaded', async () => {
    await answer(states);
    await drillDown(jonglei);
    expect(url?.placeCode).toBe('SS03');
    expect(requestedFilter()).toBe(
        "(countryCodeIso3='SSD') AND adminLevel=2 AND placeCodeLevel1='SS03' AND placeCode IN ('SS0303','SS0401')",
    );
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().drillPath).toEqual([]);
    expect(adminAreas().parentAdminArea).toBeUndefined();

    await answer(jongleiCounties);
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().drillPath).toEqual([jonglei]);
    expect(adminAreas().parentAdminArea).toEqual(jonglei);
    expect(adminAreas().adminAreas).toBe(jongleiCounties);

    await drillUp();
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=1 AND placeCode IN');
    expect(adminAreas().adminLevel).toBe(2);

    await answer(states);
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().parentAdminArea).toBeUndefined();
});

test('stays on the shown level when the requested admin areas do not load', async () => {
    await drillDown(jonglei);
    await answer(undefined);

    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=1 AND placeCode IN');
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().canDrillDown(jonglei.placeCode)).toBe(true);
});

test('remembers an admin area without children as the finest level', async () => {
    await answer(states);
    await drillDown(jonglei);
    await answer(noAdminAreas);

    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=1 AND placeCode IN');
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().adminAreas).toBe(states);
    expect(adminAreas().canDrillDown(jonglei.placeCode)).toBe(false);
    expect(adminAreas().canDrillDown('SS04' as PlaceCode)).toBe(true);

    // Not requested again.
    await drillDown(jonglei);
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=1 AND placeCode IN');
});

test('drills down only into exposed admin levels', async () => {
    await drillDown(jonglei);
    await answer(jongleiCounties);
    await drillDown(borSouth);
    await answer(borSouthPayams);

    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().canDrillDown('SS030301' as PlaceCode)).toBe(false);
});

test('does not drill up from the top', async () => {
    const shown = adminAreas();

    await drillUp();

    expect(adminAreas()).toBe(shown);
    expect(adminAreas().adminLevel).toBe(1);
    expect(requestedFilter()).toContain('adminLevel=1 AND placeCode IN');
});

test('jumps back to a level drilled through', async () => {
    await drillDown(jonglei);
    await answer(jongleiCounties);
    await drillDown(borSouth);
    await answer(borSouthPayams);
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().drillPath).toEqual([jonglei, borSouth]);

    await drillUpTo(1);
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=1 AND placeCode IN ('SS03','SS04')");
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().drillPath).toEqual([jonglei, borSouth]);

    await answer(states);
    expect(adminAreas().initialAdminLevel).toBe(1);
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().drillPath).toEqual([]);
    expect(adminAreas().parentAdminArea).toBeUndefined();

    await drillDown(jonglei);
    await answer(jongleiCounties);
    await drillDown(borSouth);
    await answer(borSouthPayams);

    await drillUpTo(2);
    expect(url?.placeCode).toBe('SS03');
    expect(requestedFilter()).toBe(
        "(countryCodeIso3='SSD') AND adminLevel=2 AND placeCodeLevel1='SS03' AND placeCode IN ('SS0303','SS0401')",
    );

    await answer(jongleiCounties);
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().drillPath).toEqual([jonglei]);
    expect(adminAreas().parentAdminArea).toEqual(jonglei);
});

test('jumps back to the first exposed level of the event', async () => {
    await render(eventSplitAtCounties);
    expect(adminAreas().initialAdminLevel).toBe(2);
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=2 AND placeCode IN ('SS0303','SS0304')");
    await answer(jongleiCounties);

    await drillDown(borSouth);
    await answer(borSouthPayams);
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().drillPath).toEqual([borSouth]);

    await drillUpTo(2);
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=2 AND placeCode IN ('SS0303','SS0304')");

    await answer(jongleiCounties);
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().drillPath).toEqual([]);
});

test('starts over at the top for another event, or the same one again', async () => {
    await drillDown(jonglei);
    await answer(jongleiCounties);
    expect(adminAreas().adminLevel).toBe(2);

    await selectEvent(undefined);
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().adminAreas).toBeUndefined();
    expect(requestedFilter()).toBeUndefined();

    await selectEvent(event);
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().parentAdminArea).toBeUndefined();
    expect(adminAreas().adminAreas).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=1 AND placeCode IN');
});

test('opens at the admin area in the url, once its admin areas have loaded', async () => {
    // Act
    await openUrl('SS0303');

    // Assert
    expect(requestedFilter()).toBe(
        "(countryCodeIso3='SSD') AND adminLevel=3 AND placeCodeLevel2='SS0303' AND placeCode IN ('SS030301')",
    );
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().drillPath).toEqual([]);

    // Act
    await answer(borSouthPayams);

    // Assert
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().drillPath).toEqual([jonglei, borSouth]);
    expect(adminAreas().parentAdminArea).toEqual(borSouth);
    expect(adminAreas().adminAreas).toBe(borSouthPayams);
});

test('opens at the top for an admin area in the url that cannot be drilled into', async () => {
    // Arrange
    const topFilter = "(countryCodeIso3='SSD') AND adminLevel=1 AND placeCode IN ('SS03','SS04')";

    // Act: not exposed.
    await openUrl('SS05');

    // Assert
    expect(requestedFilter()).toBe(topFilter);

    // Act: above the first level with several exposed admin areas.
    await openUrl('SS');

    // Assert
    expect(requestedFilter()).toBe(topFilter);

    // Act: at the deepest exposed level.
    await openUrl('SS030301');

    // Assert
    expect(requestedFilter()).toBe(topFilter);
});

test('opens at the top for an admin area in the url without children', async () => {
    // Act
    await openUrl('SS03');
    await answer(noAdminAreas);

    // Assert
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=1 AND placeCode IN');
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().canDrillDown(jonglei.placeCode)).toBe(false);
});
