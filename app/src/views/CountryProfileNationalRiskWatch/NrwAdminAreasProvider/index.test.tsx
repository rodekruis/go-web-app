import {
    act,
    useContext,
    useEffect,
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
const lakes: AdminAreaProperties = {
    adminLevel: 1 as AdminLevel,
    placeCode: 'SS04' as PlaceCode,
    name: 'Lakes',
};
const borSouth: AdminAreaProperties = {
    adminLevel: 2 as AdminLevel,
    placeCode: 'SS0303' as PlaceCode,
    name: 'Bor South',
};
const bor: AdminAreaProperties = {
    adminLevel: 3 as AdminLevel,
    placeCode: 'SS030301' as PlaceCode,
    name: 'Bor',
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

function createAdminAreas(adminLevel: number, placeCodes: string[]) {
    return {
        type: 'FeatureCollection',
        features: placeCodes.map((placeCode) => ({
            type: 'Feature',
            geometry: null,
            properties: { adminLevel, placeCode, nameEn: placeCode },
        })),
    } as unknown as NrwAdminAreaFeatureCollection;
}

const states = createAdminAreas(1, ['SS03', 'SS04']);
// Twic East is not exposed in the event.
const jongleiCounties = createAdminAreas(2, ['SS0303', 'SS0304']);
const lakesCounties = createAdminAreas(2, ['SS0401']);
const borSouthPayams = createAdminAreas(3, ['SS030301']);

// Only the exposed admin areas of the initial level are requested.
const statesFilter = "(countryCodeIso3='SSD') AND adminLevel=1 AND placeCode IN ('SS03','SS04')";

let root: Root | undefined;
let container: HTMLDivElement | undefined;
let latest: NrwAdminAreasContextProps | undefined;

function Probe() {
    const value = useContext(NrwAdminAreasContext);

    useEffect(() => {
        latest = value;
    });

    return null;
}

function adminAreas() {
    if (!latest) {
        throw new Error('NrwAdminAreasProvider has not rendered');
    }
    return latest;
}

function unselectedPlaceCodes() {
    return adminAreas().unselectedAdminAreas?.features.map(
        ({ properties }) => properties.placeCode,
    );
}

function unexposedPlaceCodes() {
    return adminAreas().unexposedAdminAreas?.features.map(
        ({ properties }) => properties.placeCode,
    );
}

function shownPlaceCodes() {
    return adminAreas().adminAreas?.features.map(({ properties }) => properties.placeCode);
}

async function render(renderedEvent: NrwEvent | undefined) {
    if (!root) {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    }
    await act(async () => {
        root?.render(
            <NrwAdminAreasProvider event={renderedEvent}>
                <Probe />
            </NrwAdminAreasProvider>,
        );
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
    adminAreasRequest = undefined;
});

test('opens at the first level with several exposed areas', () => {
    expect(adminAreas().initialAdminLevel).toBe(1);
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().drillPath).toEqual([]);
    expect(adminAreas().parentAdminArea).toBeUndefined();
    expect(adminAreas().adminAreas).toBeUndefined();
    expect(adminAreas().canDrillDown(jonglei)).toBe(true);
    expect(requestedFilter()).toBe(statesFilter);
});

test('shows the next level only once its admin areas have loaded', async () => {
    await answer(states);
    await drillDown(jonglei);
    expect(requestedFilter()).toBe(
        "(countryCodeIso3='SSD') AND adminLevel=2 AND placeCodeLevel1='SS03'",
    );
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().drillPath).toEqual([]);
    expect(adminAreas().parentAdminArea).toBeUndefined();

    await answer(jongleiCounties);
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().drillPath).toEqual([jonglei]);
    expect(adminAreas().parentAdminArea).toEqual(jonglei);
    expect(shownPlaceCodes()).toEqual(['SS0303']);

    await drillUp();
    expect(requestedFilter()).toBe(statesFilter);
    expect(adminAreas().adminLevel).toBe(2);

    await answer(states);
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().parentAdminArea).toBeUndefined();
});

test('stays on the shown level when the requested admin areas do not load', async () => {
    await drillDown(jonglei);
    await answer(undefined);

    expect(requestedFilter()).toBe(statesFilter);
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().canDrillDown(jonglei)).toBe(true);
});

test('remembers an admin area without exposed children as the finest level', async () => {
    await answer(states);
    await drillDown(jonglei);
    await answer(createAdminAreas(2, ['SS0304']));

    expect(requestedFilter()).toBe(statesFilter);
    expect(adminAreas().adminLevel).toBe(1);
    expect(shownPlaceCodes()).toEqual(['SS03', 'SS04']);
    expect(adminAreas().canDrillDown(jonglei)).toBe(false);
    expect(adminAreas().canDrillDown(lakes)).toBe(true);

    await drillDown(lakes);
    await answer(noAdminAreas);
    expect(adminAreas().canDrillDown(lakes)).toBe(false);

    // Not requested again.
    await drillDown(jonglei);
    expect(requestedFilter()).toBe(statesFilter);
});

test('drills down only into exposed admin levels', async () => {
    await drillDown(jonglei);
    await answer(jongleiCounties);
    await drillDown(borSouth);
    await answer(borSouthPayams);

    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().canDrillDown(bor)).toBe(false);
});

test('shows the unexposed admin areas apart, not drillable', async () => {
    const twicEast: AdminAreaProperties = {
        adminLevel: 2 as AdminLevel,
        placeCode: 'SS0304' as PlaceCode,
        name: 'Twic East',
    };

    await answer(states);
    await drillDown(jonglei);
    await answer(jongleiCounties);

    expect(shownPlaceCodes()).toEqual(['SS0303']);
    expect(unselectedPlaceCodes()).toEqual(['SS04']);
    expect(unexposedPlaceCodes()).toEqual(['SS0304']);
    expect(adminAreas().canDrillDown(twicEast)).toBe(false);

    await drillDown(borSouth);
    await answer(createAdminAreas(3, ['SS030301', 'SS030302']));
    expect(unselectedPlaceCodes()).toEqual(['SS04']);
    expect(unexposedPlaceCodes()).toEqual(['SS0304', 'SS030302']);
});

test('shows the unselected admin areas around the drill path, up to the initial level', async () => {
    await answer(states);
    expect(adminAreas().unselectedAdminAreas).toBeUndefined();

    await drillDown(jonglei);
    await answer(createAdminAreas(2, ['SS0303']));
    expect(unselectedPlaceCodes()).toEqual(['SS04']);

    await drillDown(borSouth);
    await answer(borSouthPayams);
    expect(unselectedPlaceCodes()).toEqual(['SS04']);

    await drillUpTo(1);
    await answer(states);
    expect(adminAreas().unselectedAdminAreas).toBeUndefined();
});

test('drills up and sideways into an unselected admin area', async () => {
    await answer(states);
    await drillDown(jonglei);
    await answer(jongleiCounties);
    await drillDown(borSouth);
    await answer(borSouthPayams);
    expect(unselectedPlaceCodes()).toEqual(['SS04']);
    expect(adminAreas().canDrillDown(lakes)).toBe(true);

    await drillDown(lakes);
    expect(requestedFilter()).toBe(
        "(countryCodeIso3='SSD') AND adminLevel=2 AND placeCodeLevel1='SS04'",
    );

    await answer(lakesCounties);
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().drillPath).toEqual([lakes]);
    expect(unselectedPlaceCodes()).toEqual(['SS03']);
});

test('does not drill up from the top', async () => {
    const shown = adminAreas();

    await drillUp();

    expect(adminAreas()).toBe(shown);
    expect(adminAreas().adminLevel).toBe(1);
    expect(requestedFilter()).toBe(statesFilter);
});

test('jumps back to a level drilled through', async () => {
    await drillDown(jonglei);
    await answer(jongleiCounties);
    await drillDown(borSouth);
    await answer(borSouthPayams);
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().drillPath).toEqual([jonglei, borSouth]);

    await drillUpTo(1);
    expect(requestedFilter()).toBe(statesFilter);
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
    expect(requestedFilter()).toBe(
        "(countryCodeIso3='SSD') AND adminLevel=2 AND placeCodeLevel1='SS03'",
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
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=2 AND placeCode IN ('SS0303','SS0304')");

    await answer(jongleiCounties);
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().drillPath).toEqual([]);
});

test('starts over at the top for another event, or the same one again', async () => {
    await drillDown(jonglei);
    await answer(jongleiCounties);
    expect(adminAreas().adminLevel).toBe(2);

    await render(undefined);
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().adminAreas).toBeUndefined();
    expect(requestedFilter()).toBeUndefined();

    await render(event);
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().parentAdminArea).toBeUndefined();
    expect(adminAreas().adminAreas).toBeUndefined();
    expect(requestedFilter()).toBe(statesFilter);
});
