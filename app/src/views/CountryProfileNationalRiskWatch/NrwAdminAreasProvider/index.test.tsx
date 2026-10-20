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
// The filters fetched: the request hook fetches when its filter changes, or
// when it is no longer skipped.
let fetches: string[] = [];

function requestedFilter() {
    if (!adminAreasRequest || adminAreasRequest.skip) {
        return undefined;
    }
    return adminAreasRequest.query?.filter;
}

vi.mock('#utils/restRequest', () => ({
    useNrwRequest: (request: AdminAreasRequest) => {
        if (request.url === '/admin-areas') {
            const filter = request.skip ? undefined : request.query?.filter;
            if (filter !== undefined && filter !== requestedFilter()) {
                fetches.push(filter);
            }
            adminAreasRequest = request;
        }
        return { response: undefined, pending: false, error: undefined };
    },
}));

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
    alertClass: 'high',
    exposedAdminAreas: {
        0: [createArea('SS', 'South Sudan')],
        1: [createArea('SS03', 'Jonglei'), createArea('SS04', 'Lakes')],
        2: [createArea('SS0303', 'Bor South'), createArea('SS0401', 'Awerial')],
        3: [createArea('SS030301', 'Bor'), createArea('SS030302', 'Kolnyang')],
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
const awerial: AdminAreaProperties = {
    adminLevel: 2 as AdminLevel,
    placeCode: 'SS0401' as PlaceCode,
    name: 'Awerial',
};
const bor: AdminAreaProperties = {
    adminLevel: 3 as AdminLevel,
    placeCode: 'SS030301' as PlaceCode,
    name: 'Bor',
};
const kolnyang: AdminAreaProperties = {
    adminLevel: 3 as AdminLevel,
    placeCode: 'SS030302' as PlaceCode,
    name: 'Kolnyang',
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

// The exposed admin areas of the event at the level below the given drill
// path, with the place codes of their parents, as the server returns them.
// The place codes nest, so the children of an admin area start with its code.
function adminAreasBelow(...path: AdminAreaProperties[]): NrwAdminAreaFeatureCollection {
    const parent = path.at(-1);
    const adminLevel = (parent?.adminLevel ?? 0) + 1;
    const parentPlaceCodes = Object.fromEntries(path.map(
        (adminArea) => [`placeCodeLevel${adminArea.adminLevel}`, adminArea.placeCode],
    ));
    const features = (event.exposedAdminAreas[adminLevel] ?? [])
        .filter(({ placeCode }) => placeCode.startsWith(parent?.placeCode ?? ''))
        .map(({ placeCode, name }) => ({
            type: 'Feature',
            geometry: null,
            properties: {
                adminLevel,
                placeCode,
                nameEn: name,
                ...parentPlaceCodes,
            },
        }));

    return { type: 'FeatureCollection', features } as unknown as NrwAdminAreaFeatureCollection;
}

// The admin area looked up by its place code, with the place codes of its
// parents, as the server returns it.
function lookedUpAdminArea(...pathToAdminArea: AdminAreaProperties[]) {
    const adminArea = pathToAdminArea.at(-1);
    const { features } = adminAreasBelow(...pathToAdminArea.slice(0, -1));

    return {
        type: 'FeatureCollection',
        features: features.filter(
            ({ properties }) => properties.placeCode === adminArea?.placeCode,
        ),
    } as unknown as NrwAdminAreaFeatureCollection;
}

const states = adminAreasBelow();
const jongleiCounties = adminAreasBelow(jonglei);
const borSouthPayams = adminAreasBelow(jonglei, borSouth);

let root: Root | undefined;
let container: HTMLDivElement | undefined;
let latest: NrwAdminAreasContextProps | undefined;

// Stands in for the url, which keeps the admin area of interest.
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
    if (!adminAreasRequest || adminAreasRequest.skip) {
        throw new Error('No admin areas are requested');
    }
    const { onSuccess, onFailure } = adminAreasRequest;
    await act(async () => {
        if (response) {
            onSuccess?.(response);
        } else {
            onFailure?.();
        }
    });
}

beforeEach(async () => {
    await render(event);
    // The top is requested on render; count only what the test requests.
    fetches = [];
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
    fetches = [];
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

test('selects an admin area without children, as the finest level', async () => {
    await answer(states);
    await drillDown(jonglei);
    expect(adminAreas().selectedAdminArea).toBeUndefined();

    await answer(noAdminAreas);
    expect(url?.placeCode).toBe('SS03');
    expect(requestedFilter()).toBeUndefined();
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().adminAreas).toBe(states);
    expect(adminAreas().selectedAdminArea).toEqual(jonglei);
    expect(adminAreas().canDrillDown(jonglei.placeCode)).toBe(false);
    expect(adminAreas().canDrillDown(lakes.placeCode)).toBe(true);
});

test('drills into another admin area while one is selected', async () => {
    // Arrange
    await answer(states);
    await drillDown(jonglei);
    await answer(noAdminAreas);

    // Act
    await drillDown(lakes);

    // Assert: the selection is cleared before the admin areas load.
    expect(url?.placeCode).toBe('SS04');
    expect(requestedFilter()).toContain("adminLevel=2 AND placeCodeLevel1='SS04'");
    expect(adminAreas().selectedAdminArea).toBeUndefined();
    expect(adminAreas().adminLevel).toBe(1);

    // Act
    await answer(adminAreasBelow(lakes));

    // Assert
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().drillPath).toEqual([lakes]);
});

test('drills down only into exposed admin levels', async () => {
    await drillDown(jonglei);
    await answer(jongleiCounties);
    await drillDown(borSouth);
    await answer(borSouthPayams);

    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().hasChildren('SS030301' as PlaceCode)).toBe(false);
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
        "(countryCodeIso3='SSD') AND adminLevel=3 AND placeCodeLevel2='SS0303' AND placeCode IN ('SS030301','SS030302')",
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

test('opens at the top for an admin area in the url that is not exposed, or above the first level', async () => {
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
});

test('selects an admin area at the deepest level', async () => {
    // Arrange
    await drillDown(jonglei);
    await answer(jongleiCounties);
    await drillDown(borSouth);
    await answer(borSouthPayams);

    // Act
    await drillDown(bor);

    // Assert: the shown level is not requested again.
    expect(url?.placeCode).toBe('SS030301');
    expect(requestedFilter()).toBeUndefined();
    expect(adminAreas().selectedAdminArea).toEqual(bor);
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().drillPath).toEqual([jonglei, borSouth, bor]);
    expect(adminAreas().parentAdminArea).toEqual(borSouth);
});

test('moves the selection to another admin area at the deepest level', async () => {
    // Arrange
    await drillDown(jonglei);
    await answer(jongleiCounties);
    await drillDown(borSouth);
    await answer(borSouthPayams);
    await drillDown(bor);
    const fetched = fetches.length;

    // Act
    await drillDown(kolnyang);

    // Assert
    expect(url?.placeCode).toBe('SS030302');
    expect(adminAreas().selectedAdminArea).toEqual(kolnyang);
    expect(fetches).toHaveLength(fetched);
});

test('clears the selection before drilling up', async () => {
    // Arrange
    await drillDown(jonglei);
    await answer(jongleiCounties);
    await drillDown(borSouth);
    await answer(borSouthPayams);
    await drillDown(bor);
    const fetched = fetches.length;

    // Act: the crumb of the admin area drilled into.
    await drillUpTo(3);

    // Assert
    expect(url?.placeCode).toBe('SS0303');
    expect(adminAreas().selectedAdminArea).toBeUndefined();
    expect(adminAreas().adminLevel).toBe(3);

    // Act: the Back button.
    await drillDown(bor);
    await drillUp();

    // Assert
    expect(url?.placeCode).toBe('SS0303');
    expect(adminAreas().selectedAdminArea).toBeUndefined();
    expect(adminAreas().adminLevel).toBe(3);
    expect(fetches).toHaveLength(fetched);

    // Act
    await drillUp();

    // Assert
    expect(url?.placeCode).toBe('SS03');
    expect(requestedFilter()).toContain("adminLevel=2 AND placeCodeLevel1='SS03'");
});

test('clears the selection at the top, where there is no level to drill up to', async () => {
    // Arrange
    await answer(states);
    await drillDown(jonglei);
    await answer(noAdminAreas);
    const fetched = fetches.length;

    // Act
    await drillUp();

    // Assert
    expect(url?.placeCode).toBeUndefined();
    expect(adminAreas().selectedAdminArea).toBeUndefined();
    expect(adminAreas().adminLevel).toBe(1);

    // Act
    await drillUp();

    // Assert
    expect(adminAreas().adminLevel).toBe(1);
    expect(fetches).toHaveLength(fetched);
});

test('opens at the admin area in the url at the deepest level, once looked up', async () => {
    // Arrange
    const siblingsFilter = "(countryCodeIso3='SSD') AND adminLevel=3 AND placeCodeLevel2='SS0303' AND placeCode IN ('SS030301','SS030302')";

    // Act: the admin area is looked up, to know its parent.
    await openUrl('SS030301');

    // Assert
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=3 AND placeCode IN ('SS030301')");
    expect(adminAreas().selectedAdminArea).toBeUndefined();

    // Act
    await answer(lookedUpAdminArea(jonglei, borSouth, bor));

    // Assert: then it is shown with its siblings.
    expect(requestedFilter()).toBe(siblingsFilter);
    expect(adminAreas().selectedAdminArea).toBeUndefined();

    // Act
    await answer(borSouthPayams);
    const fetched = fetches.length;

    // Assert
    expect(url?.placeCode).toBe('SS030301');
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().drillPath).toEqual([jonglei, borSouth, bor]);
    expect(adminAreas().selectedAdminArea).toEqual(bor);

    // Act: the Back button clears the selection.
    await drillUp();

    // Assert: the shown level is not requested again.
    expect(url?.placeCode).toBe('SS0303');
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().selectedAdminArea).toBeUndefined();
    expect(fetches).toHaveLength(fetched);

    // Act: open the same link again from the top.
    await drillUpTo(1);
    await answer(states);
    await openUrl('SS030301');

    // Assert: its parent is known, so it is not looked up again.
    expect(requestedFilter()).toBe(siblingsFilter);
});

test('opens at the admin area in the url without children, selected', async () => {
    // Act
    await openUrl('SS03');
    await answer(noAdminAreas);

    // Assert: the top is requested, where it is one of the admin areas.
    expect(url?.placeCode).toBe('SS03');
    expect(requestedFilter()).toContain('adminLevel=1 AND placeCode IN');
    expect(adminAreas().adminLevel).toBe(1);
    expect(adminAreas().hasChildren(jonglei.placeCode)).toBe(false);
    expect(adminAreas().selectedAdminArea).toBeUndefined();

    // Act
    await answer(states);

    // Assert
    expect(adminAreas().selectedAdminArea).toEqual(jonglei);
});

test('opens at the admin area in the url without children below the top, once looked up', async () => {
    // Act: its children are requested first.
    await openUrl('SS0303');
    await answer(noAdminAreas);

    // Assert: it is not shown, so it is looked up to know its parent.
    expect(url?.placeCode).toBe('SS0303');
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=2 AND placeCode IN ('SS0303')");

    // Act
    await answer(lookedUpAdminArea(jonglei, borSouth));

    // Assert: then it is shown with its siblings.
    expect(requestedFilter()).toBe(
        "(countryCodeIso3='SSD') AND adminLevel=2 AND placeCodeLevel1='SS03' AND placeCode IN ('SS0303','SS0401')",
    );

    // Act
    await answer(jongleiCounties);

    // Assert
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().drillPath).toEqual([jonglei, borSouth]);
    expect(adminAreas().selectedAdminArea).toEqual(borSouth);
    expect(adminAreas().canDrillDown(borSouth.placeCode)).toBe(false);
});

test('shows the siblings of an admin area in the url without children under another parent', async () => {
    // Arrange: the counties of one state are shown.
    await drillDown(jonglei);
    await answer(jongleiCounties);

    // Act: a county of the other state, without children.
    await openUrl('SS0401');
    await answer(noAdminAreas);

    // Assert: it is not shown, so it is looked up.
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=2 AND placeCode IN ('SS0401')");

    // Act
    await answer(lookedUpAdminArea(lakes, awerial));

    // Assert: the counties of its state are requested.
    expect(requestedFilter()).toBe(
        "(countryCodeIso3='SSD') AND adminLevel=2 AND placeCodeLevel1='SS04' AND placeCode IN ('SS0303','SS0401')",
    );

    // Act
    await answer(adminAreasBelow(lakes));

    // Assert
    expect(adminAreas().drillPath).toEqual([lakes, awerial]);
    expect(adminAreas().selectedAdminArea).toEqual(awerial);
});

test('opens at the top for an admin area in the url that the server does not know', async () => {
    // Act: nothing is found when it is looked up.
    await openUrl('SS030301');
    await answer(noAdminAreas);

    // Assert
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=1 AND placeCode IN');

    // Act: or the lookup does not load.
    await openUrl('SS030302');
    await answer(undefined);

    // Assert
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=1 AND placeCode IN');
});

test('stays on the shown level when the siblings of the admin area in the url do not load', async () => {
    // Arrange
    await openUrl('SS030301');
    await answer(lookedUpAdminArea(jonglei, borSouth, bor));

    // Act: nothing is shown yet, so the top is requested.
    await answer(undefined);

    // Assert
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=1 AND placeCode IN');

    // Arrange
    await answer(states);
    await drillDown(jonglei);
    await answer(jongleiCounties);
    const fetched = fetches.length;

    // Act: its parent is known, so its siblings are requested at once.
    await openUrl('SS030301');

    // Assert
    expect(requestedFilter()).toContain("adminLevel=3 AND placeCodeLevel2='SS0303'");

    // Act
    await answer(undefined);

    // Assert: the shown level stays, not requested again, with nothing selected.
    expect(url?.placeCode).toBe('SS03');
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().selectedAdminArea).toBeUndefined();
    expect(fetches).toHaveLength(fetched + 1);
});

test('stays on the shown level when the siblings of the admin area in the url are not found', async () => {
    // Arrange
    await openUrl('SS030301');
    await answer(lookedUpAdminArea(jonglei, borSouth, bor));

    // Act: nothing is shown yet, so the top is requested.
    await answer(noAdminAreas);

    // Assert
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=1 AND placeCode IN');
});
