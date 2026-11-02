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
import { isDefined } from '@togglecorp/fujs';
import {
    afterEach,
    beforeEach,
    expect,
    test,
    vi,
} from 'vitest';

import { createExposedArea } from '#utils/testing/nrwAdminAreaTesting';

import {
    type AdminAreaProperties,
    type AdminLevel,
    type NrwAdminAreaFeatureCollection,
    type NrwEvent,
    type PlaceCode,
    type PlaceCodeChangeHandler,
} from '../types';
import { minAdminLevel } from '../utils';
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

// The request for the admin areas beside the drill path has no callbacks;
// it answers with the response the test sets.
let unselectedAdminAreasRequest: AdminAreasRequest | undefined;
let unselectedAdminAreasResponse: NrwAdminAreaFeatureCollection | undefined;

function requestedFilter() {
    if (!adminAreasRequest || adminAreasRequest.skip) {
        return undefined;
    }
    return adminAreasRequest.query?.filter;
}

function requestedUnselectedFilter() {
    if (!unselectedAdminAreasRequest || unselectedAdminAreasRequest.skip) {
        return undefined;
    }
    return unselectedAdminAreasRequest.query?.filter;
}

vi.mock('#utils/restRequest', () => ({
    useNrwRequest: (request: AdminAreasRequest) => {
        if (request.url === '/admin-areas' && !request.onSuccess) {
            unselectedAdminAreasRequest = request;
            return { response: unselectedAdminAreasResponse, pending: false, error: undefined };
        }
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

// Two counties in different states, each with payams, and one payam with bomas.
// The states are never shown: admin level 1 is skipped.
const event = {
    eventId: 8,
    countryCodeIso3: 'SSD',
    alertClass: 'high',
    exposedAdminAreas: {
        0: [createExposedArea('SS', 'South Sudan')],
        1: [createExposedArea('SS03', 'Jonglei'), createExposedArea('SS04', 'Lakes')],
        2: [createExposedArea('SS0303', 'Bor South'), createExposedArea('SS0401', 'Awerial')],
        3: [
            createExposedArea('SS030301', 'Bor'),
            createExposedArea('SS030302', 'Kolnyang'),
            createExposedArea('SS040101', 'Bunagok'),
        ],
        4: [createExposedArea('SS03030101', 'Langbar'), createExposedArea('SS03030102', 'Marol')],
    },
} as unknown as NrwEvent;

// The states only parent the admin areas the server returns.
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
const bunagok: AdminAreaProperties = {
    adminLevel: 3 as AdminLevel,
    placeCode: 'SS040101' as PlaceCode,
    name: 'Bunagok',
};
const langbar: AdminAreaProperties = {
    adminLevel: 4 as AdminLevel,
    placeCode: 'SS03030101' as PlaceCode,
    name: 'Langbar',
};
const marol: AdminAreaProperties = {
    adminLevel: 4 as AdminLevel,
    placeCode: 'SS03030102' as PlaceCode,
    name: 'Marol',
};

// One county with two payams, so the drill starts at the payams.
const eventSplitAtPayams = {
    ...event,
    eventId: 9,
    exposedAdminAreas: {
        0: [createExposedArea('SS', 'South Sudan')],
        1: [createExposedArea('SS03', 'Jonglei')],
        2: [createExposedArea('SS0303', 'Bor South')],
        3: [createExposedArea('SS030301', 'Bor'), createExposedArea('SS030302', 'Kolnyang')],
        4: [createExposedArea('SS03030101', 'Langbar')],
    },
} as unknown as NrwEvent;

const noAdminAreas = {
    type: 'FeatureCollection',
    features: [],
} as unknown as NrwAdminAreaFeatureCollection;

// The exposed admin areas of the event at the level below the given drill path, or at the
// top without one, with the place codes of their parents, as the server returns them.
// The place codes nest, so the children of an admin area start with its code.
function adminAreasBelow(...path: AdminAreaProperties[]): NrwAdminAreaFeatureCollection {
    const parent = path.at(-1);
    const adminLevel = isDefined(parent) ? parent.adminLevel + 1 : minAdminLevel;
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

const counties = adminAreasBelow();
const borSouthPayams = adminAreasBelow(jonglei, borSouth);
const awerialPayams = adminAreasBelow(lakes, awerial);
const borBomas = adminAreasBelow(jonglei, borSouth, bor);

function combined(...collections: NrwAdminAreaFeatureCollection[]) {
    return {
        type: 'FeatureCollection',
        features: collections.flatMap(({ features }) => features),
    } as NrwAdminAreaFeatureCollection;
}

// An admin area that is not exposed in the event, below the given drill path.
function unexposedAdminAreaBelow(placeCode: string, ...path: AdminAreaProperties[]) {
    const parentPlaceCodes = Object.fromEntries(path.map(
        (adminArea) => [`placeCodeLevel${adminArea.adminLevel}`, adminArea.placeCode],
    ));

    return {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            geometry: null,
            properties: {
                adminLevel: (path.at(-1)?.adminLevel ?? 0) + 1,
                placeCode,
                nameEn: placeCode,
                ...parentPlaceCodes,
            },
        }],
    } as unknown as NrwAdminAreaFeatureCollection;
}

const makuach = unexposedAdminAreaBelow('SS030303', jonglei, borSouth);

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

function selectedPlaceCodes() {
    return adminAreas().selectedAdminAreas?.features.map(
        ({ properties }) => properties.placeCode,
    );
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
    unselectedAdminAreasRequest = undefined;
    unselectedAdminAreasResponse = undefined;
    fetches = [];
});

test('requests the admin areas beside the drill path, also for a link', async () => {
    expect(requestedUnselectedFilter()).toBeUndefined();

    await openUrl('SS030301');
    await answer(borBomas);

    expect(adminAreas().drillPath).toEqual([borSouth, bor]);
    expect(requestedUnselectedFilter()).toBe(
        "(countryCodeIso3='SSD') AND ((adminLevel=2 AND placeCode IN ('SS0303','SS0401'))"
        + " OR (adminLevel=3 AND placeCodeLevel2='SS0303'))",
    );
});

test('shows only the admin areas beside the drill path as unselected', async () => {
    // Arrange: Bunagok lies in Awerial, so it is not beside the path through Bor South,
    // and the bomas are on the shown level.
    unselectedAdminAreasResponse = combined(
        counties,
        borSouthPayams,
        awerialPayams,
        borBomas,
    );

    // Act
    await drillDown(borSouth);
    await answer(borSouthPayams);
    await drillDown(bor);
    await answer(borBomas);

    // Assert
    expect(unselectedPlaceCodes()).toEqual(['SS0401', 'SS030302']);

    // Act
    await drillUpTo(2);
    await answer(counties);

    // Assert
    expect(adminAreas().unselectedAdminAreas).toBeUndefined();
});

test('drills sideways and up into an unselected admin area', async () => {
    // Arrange
    unselectedAdminAreasResponse = counties;
    await drillDown(borSouth);
    await answer(borSouthPayams);
    await drillDown(bor);
    await answer(borBomas);
    expect(adminAreas().canDrillDown(awerial.placeCode)).toBe(true);

    // Act
    await drillDown(awerial);
    await answer(awerialPayams);

    // Assert
    expect(url?.placeCode).toBe('SS0401');
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().drillPath).toEqual([awerial]);
    expect(unselectedPlaceCodes()).toEqual(['SS0303']);
});

test('keeps the shown admin areas when the admin areas beside the drill path load', async () => {
    // Arrange: a link to an admin area.
    await openUrl('SS030301');
    await answer(borBomas);
    const shownAdminAreas = adminAreas().adminAreas;

    // Act
    unselectedAdminAreasResponse = combined(counties, borSouthPayams);
    await render(event);

    // Assert: the map fits to them, so a new object would undo the map view of the link.
    expect(unselectedPlaceCodes()).toEqual(['SS0401', 'SS030302']);
    expect(adminAreas().adminAreas).toBe(shownAdminAreas);
});

test('shows the unexposed admin areas apart on the shown level, and as unselected beside the drill path', async () => {
    // Arrange
    unselectedAdminAreasResponse = combined(counties, borSouthPayams, makuach);

    // Act
    await drillDown(borSouth);
    await answer(combined(borSouthPayams, makuach));

    // Assert: only the exposed admin areas are listed and coloured.
    expect(adminAreas().adminAreas).toEqual(borSouthPayams);
    expect(unexposedPlaceCodes()).toEqual(['SS030303']);
    expect(adminAreas().canDrillDown('SS030303' as PlaceCode)).toBe(false);

    // Act
    await drillDown(bor);
    await answer(combined(borBomas, unexposedAdminAreaBelow('SS03030103', jonglei, borSouth, bor)));

    // Assert
    expect(unselectedPlaceCodes()).toEqual(['SS0401', 'SS030302', 'SS030303']);
    expect(unexposedPlaceCodes()).toEqual(['SS03030103']);
    expect(adminAreas().isExposed('SS030302' as PlaceCode)).toBe(true);
    expect(adminAreas().isExposed('SS030303' as PlaceCode)).toBe(false);
});

test('selects an admin area with only unexposed children, as the finest level', async () => {
    // Arrange
    await answer(counties);

    // Act
    await drillDown(borSouth);
    await answer(makuach);

    // Assert
    expect(url?.placeCode).toBe('SS0303');
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().selectedAdminArea).toEqual(borSouth);
    expect(adminAreas().unexposedAdminAreas).toBeUndefined();
});

test('opens at the first level with several exposed areas, skipping admin level 1', () => {
    expect(adminAreas().initialAdminLevel).toBe(2);
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().drillPath).toEqual([]);
    expect(adminAreas().parentAdminArea).toBeUndefined();
    expect(adminAreas().adminAreas).toBeUndefined();
    expect(adminAreas().canDrillDown(borSouth.placeCode)).toBe(true);
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=2 AND placeCode IN ('SS0303','SS0401')");
});

test('shows the next level only once its admin areas have loaded', async () => {
    await answer(counties);
    await drillDown(borSouth);
    expect(url?.placeCode).toBe('SS0303');
    expect(requestedFilter()).toBe(
        "(countryCodeIso3='SSD') AND adminLevel=3 AND placeCodeLevel2='SS0303'",
    );
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().drillPath).toEqual([]);
    expect(adminAreas().parentAdminArea).toBeUndefined();

    await answer(borSouthPayams);
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().drillPath).toEqual([borSouth]);
    expect(adminAreas().parentAdminArea).toEqual(borSouth);
    expect(adminAreas().adminAreas).toEqual(borSouthPayams);

    await drillUp();
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=2 AND placeCode IN');
    expect(adminAreas().adminLevel).toBe(3);

    await answer(counties);
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().parentAdminArea).toBeUndefined();
});

test('stays on the shown level when the requested admin areas do not load', async () => {
    await drillDown(borSouth);
    await answer(undefined);

    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=2 AND placeCode IN');
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().canDrillDown(borSouth.placeCode)).toBe(true);
});

test('selects an admin area without children, as the finest level', async () => {
    await answer(counties);
    await drillDown(borSouth);
    expect(adminAreas().selectedAdminArea).toBeUndefined();

    await answer(noAdminAreas);
    expect(url?.placeCode).toBe('SS0303');
    expect(requestedFilter()).toBeUndefined();
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().adminAreas).toEqual(counties);
    expect(adminAreas().selectedAdminArea).toEqual(borSouth);
    expect(adminAreas().canDrillDown(borSouth.placeCode)).toBe(false);
    expect(adminAreas().canDrillDown(awerial.placeCode)).toBe(true);
});

test('drills into another admin area while one is selected', async () => {
    // Arrange
    await answer(counties);
    await drillDown(borSouth);
    await answer(noAdminAreas);

    // Act
    await drillDown(awerial);

    // Assert: the selection is cleared before the admin areas load.
    expect(url?.placeCode).toBe('SS0401');
    expect(requestedFilter()).toContain("adminLevel=3 AND placeCodeLevel2='SS0401'");
    expect(adminAreas().selectedAdminArea).toBeUndefined();
    expect(adminAreas().adminLevel).toBe(2);

    // Act
    await answer(awerialPayams);

    // Assert
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().drillPath).toEqual([awerial]);
});

test('does not drill up from the top, so admin level 1 is never shown', async () => {
    const shown = adminAreas();

    // Act: the Back button.
    await drillUp();

    // Assert
    expect(adminAreas()).toBe(shown);
    expect(adminAreas().adminLevel).toBe(2);
    expect(requestedFilter()).toContain('adminLevel=2 AND placeCode IN');

    // Act: a crumb for admin level 1 is never shown either, but it would stay at the top.
    await drillUpTo(1);

    // Assert
    expect(adminAreas()).toBe(shown);
    expect(adminAreas().adminLevel).toBe(2);
});

test('jumps back to a level drilled through', async () => {
    await drillDown(borSouth);
    await answer(borSouthPayams);
    await drillDown(bor);
    await answer(borBomas);
    expect(adminAreas().adminLevel).toBe(4);
    expect(adminAreas().drillPath).toEqual([borSouth, bor]);

    await drillUpTo(2);
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=2 AND placeCode IN ('SS0303','SS0401')");
    expect(adminAreas().adminLevel).toBe(4);
    expect(adminAreas().drillPath).toEqual([borSouth, bor]);

    await answer(counties);
    expect(adminAreas().initialAdminLevel).toBe(2);
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().drillPath).toEqual([]);
    expect(adminAreas().parentAdminArea).toBeUndefined();

    await drillDown(borSouth);
    await answer(borSouthPayams);
    await drillDown(bor);
    await answer(borBomas);

    await drillUpTo(3);
    expect(url?.placeCode).toBe('SS0303');
    expect(requestedFilter()).toBe(
        "(countryCodeIso3='SSD') AND adminLevel=3 AND placeCodeLevel2='SS0303'",
    );

    await answer(borSouthPayams);
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().drillPath).toEqual([borSouth]);
    expect(adminAreas().parentAdminArea).toEqual(borSouth);
});

test('jumps back to the first exposed level of the event', async () => {
    await render(eventSplitAtPayams);
    expect(adminAreas().initialAdminLevel).toBe(3);
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=3 AND placeCode IN ('SS030301','SS030302')");
    await answer(borSouthPayams);

    await drillDown(bor);
    await answer(borBomas);
    expect(adminAreas().adminLevel).toBe(4);
    expect(adminAreas().drillPath).toEqual([bor]);

    await drillUpTo(3);
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=3 AND placeCode IN ('SS030301','SS030302')");

    await answer(borSouthPayams);
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().drillPath).toEqual([]);
});

test('starts over at the top for another event, or the same one again', async () => {
    await drillDown(borSouth);
    await answer(borSouthPayams);
    expect(adminAreas().adminLevel).toBe(3);

    await selectEvent(undefined);
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().adminAreas).toBeUndefined();
    expect(requestedFilter()).toBeUndefined();

    await selectEvent(event);
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().parentAdminArea).toBeUndefined();
    expect(adminAreas().adminAreas).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=2 AND placeCode IN');
});

test('opens at the admin area in the url, once its admin areas have loaded', async () => {
    // Act
    await openUrl('SS030301');

    // Assert
    expect(requestedFilter()).toBe(
        "(countryCodeIso3='SSD') AND adminLevel=4 AND placeCodeLevel3='SS030301'",
    );
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().drillPath).toEqual([]);

    // Act
    await answer(borBomas);

    // Assert
    expect(adminAreas().adminLevel).toBe(4);
    expect(adminAreas().drillPath).toEqual([borSouth, bor]);
    expect(adminAreas().parentAdminArea).toEqual(bor);
    expect(adminAreas().adminAreas).toEqual(borBomas);
});

test('opens at the top for an admin area in the url that is not exposed, or above the top', async () => {
    // Arrange
    const topFilter = "(countryCodeIso3='SSD') AND adminLevel=2 AND placeCode IN ('SS0303','SS0401')";

    // Act: not exposed.
    await openUrl('SS0305');

    // Assert
    expect(requestedFilter()).toBe(topFilter);

    // Act: the country.
    await openUrl('SS');

    // Assert
    expect(requestedFilter()).toBe(topFilter);

    // Act: an exposed state, as admin level 1 is never shown.
    await openUrl('SS03');

    // Assert
    expect(requestedFilter()).toBe(topFilter);

    // Act
    await answer(counties);

    // Assert: nothing is selected at the top.
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().drillPath).toEqual([]);
    expect(adminAreas().selectedAdminArea).toBeUndefined();
});

test('selects an admin area at the deepest level', async () => {
    // Arrange
    await drillDown(borSouth);
    await answer(borSouthPayams);
    await drillDown(bor);
    await answer(borBomas);

    // Act
    await drillDown(langbar);

    // Assert: the shown level is not requested again.
    expect(url?.placeCode).toBe('SS03030101');
    expect(requestedFilter()).toBeUndefined();
    expect(adminAreas().selectedAdminArea).toEqual(langbar);
    expect(adminAreas().adminLevel).toBe(4);
    expect(adminAreas().drillPath).toEqual([borSouth, bor, langbar]);
    expect(adminAreas().parentAdminArea).toEqual(bor);
});

test('selects the admin area at the deepest level alone on the map, beside its siblings', async () => {
    // Arrange: one boma is unexposed.
    unselectedAdminAreasResponse = combined(counties, borSouthPayams);
    await drillDown(borSouth);
    await answer(borSouthPayams);
    await drillDown(bor);
    await answer(combined(borBomas, unexposedAdminAreaBelow('SS03030103', jonglei, borSouth, bor)));
    const shownAdminAreas = adminAreas().adminAreas;
    expect(adminAreas().selectedAdminAreas).toBe(shownAdminAreas);
    expect(unexposedPlaceCodes()).toEqual(['SS03030103']);

    // Act
    await drillDown(langbar);

    // Assert: its siblings, exposed or not, join the admin areas beside the drill path, while
    // the shown level stays for the list and the legend.
    expect(selectedPlaceCodes()).toEqual(['SS03030101']);
    expect(unselectedPlaceCodes()).toEqual(['SS0401', 'SS030302', 'SS03030102', 'SS03030103']);
    expect(unexposedPlaceCodes()).toBeUndefined();
    expect(adminAreas().adminAreas).toBe(shownAdminAreas);

    // Act
    await drillUp();

    // Assert
    expect(adminAreas().selectedAdminAreas).toBe(shownAdminAreas);
    expect(unselectedPlaceCodes()).toEqual(['SS0401', 'SS030302']);
    expect(unexposedPlaceCodes()).toEqual(['SS03030103']);
});

test('selects the shown level on the map when the server does not know the selected admin area', async () => {
    // Arrange: Awerial has no children, so its level is requested, and loads without it.
    await openUrl('SS0401');
    await answer(noAdminAreas);

    // Act
    await answer(lookedUpAdminArea(borSouth));

    // Assert
    expect(adminAreas().selectedAdminArea).toEqual(awerial);
    expect(adminAreas().selectedAdminAreas).toBe(adminAreas().adminAreas);
    expect(selectedPlaceCodes()).toEqual(['SS0303']);
    expect(unselectedPlaceCodes()).toBeUndefined();
});

test('moves the selection to another admin area at the deepest level', async () => {
    // Arrange
    await drillDown(borSouth);
    await answer(borSouthPayams);
    await drillDown(bor);
    await answer(borBomas);
    await drillDown(langbar);
    const fetched = fetches.length;

    // Act
    await drillDown(marol);

    // Assert
    expect(url?.placeCode).toBe('SS03030102');
    expect(adminAreas().selectedAdminArea).toEqual(marol);
    expect(fetches).toHaveLength(fetched);
});

test('clears the selection before drilling up', async () => {
    // Arrange
    await drillDown(borSouth);
    await answer(borSouthPayams);
    await drillDown(bor);
    await answer(borBomas);
    await drillDown(langbar);
    const fetched = fetches.length;

    // Act: the crumb of the admin area drilled into.
    await drillUpTo(4);

    // Assert
    expect(url?.placeCode).toBe('SS030301');
    expect(adminAreas().selectedAdminArea).toBeUndefined();
    expect(adminAreas().adminLevel).toBe(4);

    // Act: the Back button.
    await drillDown(langbar);
    await drillUp();

    // Assert
    expect(url?.placeCode).toBe('SS030301');
    expect(adminAreas().selectedAdminArea).toBeUndefined();
    expect(adminAreas().adminLevel).toBe(4);
    expect(fetches).toHaveLength(fetched);

    // Act
    await drillUp();

    // Assert
    expect(url?.placeCode).toBe('SS0303');
    expect(requestedFilter()).toContain("adminLevel=3 AND placeCodeLevel2='SS0303'");
});

test('clears the selection at the top, where there is no level to drill up to', async () => {
    // Arrange
    await answer(counties);
    await drillDown(borSouth);
    await answer(noAdminAreas);
    const fetched = fetches.length;

    // Act
    await drillUp();

    // Assert
    expect(url?.placeCode).toBeUndefined();
    expect(adminAreas().selectedAdminArea).toBeUndefined();
    expect(adminAreas().adminLevel).toBe(2);

    // Act
    await drillUp();

    // Assert
    expect(adminAreas().adminLevel).toBe(2);
    expect(fetches).toHaveLength(fetched);
});

test('opens at the admin area in the url at the deepest level, once looked up', async () => {
    // Arrange
    const siblingsFilter = "(countryCodeIso3='SSD') AND adminLevel=4 AND placeCodeLevel3='SS030301'";

    // Act: the admin area is looked up, to know its parent.
    await openUrl('SS03030101');

    // Assert
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=4 AND placeCode IN ('SS03030101')");
    expect(adminAreas().selectedAdminArea).toBeUndefined();

    // Act
    await answer(lookedUpAdminArea(jonglei, borSouth, bor, langbar));

    // Assert: then it is shown with its siblings.
    expect(requestedFilter()).toBe(siblingsFilter);
    expect(adminAreas().selectedAdminArea).toBeUndefined();

    // Act
    await answer(borBomas);
    const fetched = fetches.length;

    // Assert
    expect(url?.placeCode).toBe('SS03030101');
    expect(adminAreas().adminLevel).toBe(4);
    expect(adminAreas().drillPath).toEqual([borSouth, bor, langbar]);
    expect(adminAreas().selectedAdminArea).toEqual(langbar);

    // Act: the Back button clears the selection.
    await drillUp();

    // Assert: the shown level is not requested again.
    expect(url?.placeCode).toBe('SS030301');
    expect(adminAreas().adminLevel).toBe(4);
    expect(adminAreas().selectedAdminArea).toBeUndefined();
    expect(fetches).toHaveLength(fetched);

    // Act: open the same link again from the top.
    await drillUpTo(2);
    await answer(counties);
    await openUrl('SS03030101');

    // Assert: its parent is known, so it is not looked up again.
    expect(requestedFilter()).toBe(siblingsFilter);
});

test('opens at the admin area in the url without children, selected', async () => {
    // Act
    await openUrl('SS0303');
    await answer(noAdminAreas);

    // Assert: the top is requested, where it is one of the admin areas.
    expect(url?.placeCode).toBe('SS0303');
    expect(requestedFilter()).toContain('adminLevel=2 AND placeCode IN');
    expect(adminAreas().adminLevel).toBe(2);
    expect(adminAreas().selectedAdminArea).toBeUndefined();

    // Act
    await answer(counties);

    // Assert
    expect(adminAreas().selectedAdminArea).toEqual(borSouth);
});

test('opens at the admin area in the url without children below the top, once looked up', async () => {
    // Act: its children are requested first.
    await openUrl('SS030301');
    await answer(noAdminAreas);

    // Assert: it is not shown, so it is looked up to know its parent.
    expect(url?.placeCode).toBe('SS030301');
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=3 AND placeCode IN ('SS030301')");

    // Act
    await answer(lookedUpAdminArea(jonglei, borSouth, bor));

    // Assert: then it is shown with its siblings.
    expect(requestedFilter()).toBe(
        "(countryCodeIso3='SSD') AND adminLevel=3 AND placeCodeLevel2='SS0303'",
    );

    // Act
    await answer(borSouthPayams);

    // Assert
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().drillPath).toEqual([borSouth, bor]);
    expect(adminAreas().selectedAdminArea).toEqual(bor);
    expect(adminAreas().canDrillDown(bor.placeCode)).toBe(false);
});

test('shows the siblings of an admin area in the url without children under another parent', async () => {
    // Arrange: the payams of one county are shown.
    await drillDown(borSouth);
    await answer(borSouthPayams);

    // Act: a payam of the other county, without children.
    await openUrl('SS040101');
    await answer(noAdminAreas);

    // Assert: it is not shown, so it is looked up.
    expect(requestedFilter()).toBe("(countryCodeIso3='SSD') AND adminLevel=3 AND placeCode IN ('SS040101')");

    // Act
    await answer(lookedUpAdminArea(lakes, awerial, bunagok));

    // Assert: the payams of its county are requested.
    expect(requestedFilter()).toBe(
        "(countryCodeIso3='SSD') AND adminLevel=3 AND placeCodeLevel2='SS0401'",
    );

    // Act
    await answer(awerialPayams);

    // Assert
    expect(adminAreas().drillPath).toEqual([awerial, bunagok]);
    expect(adminAreas().selectedAdminArea).toEqual(bunagok);
});

test('opens at the top for an admin area in the url that the server does not know', async () => {
    // Act: nothing is found when it is looked up.
    await openUrl('SS03030101');
    await answer(noAdminAreas);

    // Assert
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=2 AND placeCode IN');

    // Act: or the lookup does not load.
    await openUrl('SS03030102');
    await answer(undefined);

    // Assert
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=2 AND placeCode IN');
});

test('stays on the shown level when the siblings of the admin area in the url do not load', async () => {
    // Arrange
    await openUrl('SS03030101');
    await answer(lookedUpAdminArea(jonglei, borSouth, bor, langbar));

    // Act: nothing is shown yet, so the top is requested.
    await answer(undefined);

    // Assert
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=2 AND placeCode IN');

    // Arrange
    await answer(counties);
    await drillDown(borSouth);
    await answer(borSouthPayams);
    const fetched = fetches.length;

    // Act: its parent is known, so its siblings are requested at once.
    await openUrl('SS03030101');

    // Assert
    expect(requestedFilter()).toContain("adminLevel=4 AND placeCodeLevel3='SS030301'");

    // Act
    await answer(undefined);

    // Assert: the shown level stays, not requested again, with nothing selected.
    expect(url?.placeCode).toBe('SS0303');
    expect(adminAreas().adminLevel).toBe(3);
    expect(adminAreas().selectedAdminArea).toBeUndefined();
    expect(fetches).toHaveLength(fetched + 1);
});

test('stays on the shown level when the siblings of the admin area in the url are not found', async () => {
    // Arrange
    await openUrl('SS03030101');
    await answer(lookedUpAdminArea(jonglei, borSouth, bor, langbar));

    // Act: nothing is shown yet, so the top is requested.
    await answer(noAdminAreas);

    // Assert
    expect(url?.placeCode).toBeUndefined();
    expect(requestedFilter()).toContain('adminLevel=2 AND placeCode IN');
});
