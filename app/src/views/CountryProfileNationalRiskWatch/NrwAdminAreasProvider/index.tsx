import {
    type ReactNode,
    useMemo,
    useState,
} from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import { getExposedPopulationScale } from '#utils/nrw/colors';
import {
    canNrwDrillBelow,
    getExposedAdminArea,
    getNrwAllExposedPlaceCodes,
    getNrwDrillPath,
    getNrwExposedPlaceCodes,
    getNrwInitialAdminLevel,
} from '#utils/nrw/events';
import { useNrwRequest } from '#utils/restRequest';

import useNrwAdminAreas from '../hooks/useNrwAdminAreas';
import {
    type AdminAreaProperties,
    type AdminAreasRequest,
    type AdminLevel,
    type NrwAdminAreaFeature,
    type NrwAdminAreaFeatureCollection,
    type NrwEvent,
    type PlaceCode,
    type PlaceCodeChangeHandler,
} from '../types';
import {
    getAdminAreasOfRequestsQuery,
    minAdminLevel,
    parseCountryCode,
    placeCodeLevelKeys,
} from '../utils';
import NrwAdminAreasContext, { type NrwAdminAreasContextProps } from './NrwAdminAreasContext';

function isSamePlaceCodes(placeCodes: PlaceCode[] | undefined, other: PlaceCode[] | undefined) {
    if (isNotDefined(placeCodes) || isNotDefined(other)) {
        return placeCodes === other;
    }
    return placeCodes.length === other.length
        && placeCodes.every((placeCode, index) => placeCode === other[index]);
}

function isSameAdminAreasRequest(request: AdminAreasRequest, other: AdminAreasRequest | undefined) {
    return isDefined(other)
        && request.adminLevel === other.adminLevel
        && request.parentPlaceCode === other.parentPlaceCode
        && isSamePlaceCodes(request.placeCodes, other.placeCodes);
}

function getAdminLevelRequest(
    event: NrwEvent | undefined,
    adminLevel: AdminLevel,
    parentPlaceCode: PlaceCode | undefined,
): AdminAreasRequest {
    // The initial level has no parent: only its exposed admin areas, so none show as unexposed.
    if (isNotDefined(parentPlaceCode)) {
        return {
            adminLevel,
            parentPlaceCode,
            placeCodes: isDefined(event) ? getNrwExposedPlaceCodes(event, adminLevel) : [],
        };
    }

    // Below it: all children of the parent, so the unexposed ones show as well.
    return { adminLevel, parentPlaceCode, placeCodes: undefined };
}

function getFeatureCollection(
    features: NrwAdminAreaFeature[],
): NrwAdminAreaFeatureCollection | undefined {
    return features.length > 0 ? { type: 'FeatureCollection', features } : undefined;
}

function isExposed(exposedPlaceCodes: Set<string>, { properties }: NrwAdminAreaFeature) {
    return exposedPlaceCodes.has(properties.placeCode);
}

interface Drill {
    eventId: NrwEvent['eventId'] | undefined;
    shown: {
        request: AdminAreasRequest | undefined;
        path: AdminAreaProperties[];
        adminAreas: NrwAdminAreaFeatureCollection | undefined;
    };
    childlessPlaceCodes: PlaceCode[];
    // The parent of an admin area in the url, looked up to show it with its siblings.
    lookedUp: {
        placeCode: PlaceCode;
        parentPlaceCode: PlaceCode | undefined;
    } | undefined;
}

function newDrill(event: NrwEvent | undefined): Drill {
    return {
        eventId: event?.eventId,
        shown: { request: undefined, path: [], adminAreas: undefined },
        childlessPlaceCodes: [],
        lookedUp: undefined,
    };
}

function getAdminAreasRequest(
    event: NrwEvent | undefined,
    initialAdminLevel: AdminLevel,
    urlAdminArea: AdminAreaProperties | undefined,
    drill: Drill,
): { request: AdminAreasRequest; lookup?: boolean } {
    const level = (adminLevel: AdminLevel, parentPlaceCode: PlaceCode | undefined) => (
        getAdminLevelRequest(event, adminLevel, parentPlaceCode)
    );

    // The levels above the initial level are never shown.
    if (isNotDefined(event) || isNotDefined(urlAdminArea)
        || urlAdminArea.adminLevel < initialAdminLevel) {
        return { request: level(initialAdminLevel, undefined) };
    }

    const { adminLevel, placeCode } = urlAdminArea;
    // The admin area in the url is drilled into, unless it has no exposed children.
    if (canNrwDrillBelow(event, adminLevel) && !drill.childlessPlaceCodes.includes(placeCode)) {
        return { request: level((adminLevel + 1) as AdminLevel, placeCode) };
    }

    // Its level is requested instead, so it can be selected.
    if (isDefined(drill.shown.request) && drill.shown.adminAreas?.features.some(
        (feature) => feature.properties.placeCode === placeCode,
    )) {
        return { request: drill.shown.request };
    }
    // The initial level is fetched without a parent.
    if (adminLevel === initialAdminLevel) {
        return { request: level(initialAdminLevel, undefined) };
    }
    // Below the initial level, its level is fetched by its parent.
    if (drill.lookedUp?.placeCode === placeCode) {
        return { request: level(adminLevel, drill.lookedUp.parentPlaceCode) };
    }
    // The event has no parent place codes, so the admin area is looked up first.
    return {
        request: { adminLevel, parentPlaceCode: undefined, placeCodes: [placeCode] },
        lookup: true,
    };
}

// The admin areas on each level of the drill path, under the parent on the path.
function getUnselectedAdminAreasRequests(
    event: NrwEvent | undefined,
    path: AdminAreaProperties[],
): AdminAreasRequest[] {
    if (isNotDefined(event)) {
        return [];
    }

    return path.map(({ adminLevel }, index) => (
        getAdminLevelRequest(event, adminLevel, path[index - 1]?.placeCode)
    ));
}

// The admin areas beside the drill path: on each level, the siblings of the path admin area,
// without the path admin area itself. So the levels never overlap: the siblings on a level lie
// outside its path admin area, and the deeper levels and the selected admin areas lie inside it.
// The response can be for an earlier path, so only the admin areas under the current path are kept.
function getAdminAreasBesidePath(
    adminAreas: NrwAdminAreaFeatureCollection | undefined,
    path: AdminAreaProperties[],
    initialAdminLevel: AdminLevel,
): NrwAdminAreaFeature[] {
    return (adminAreas?.features ?? []).filter(({ properties }) => {
        const pathIndex = properties.adminLevel - initialAdminLevel;
        const pathAdminArea = path[pathIndex];
        const parentAdminArea = path[pathIndex - 1];
        const parentPlaceCodeKey = placeCodeLevelKeys[properties.adminLevel - 1];

        return isDefined(pathAdminArea)
            && properties.placeCode !== pathAdminArea.placeCode
            && (isNotDefined(parentAdminArea) || (isDefined(parentPlaceCodeKey)
                && properties[parentPlaceCodeKey] === parentAdminArea.placeCode));
    });
}

function NrwAdminAreasProvider(props: {
    event: NrwEvent | undefined;
    urlPlaceCode: PlaceCode | undefined;
    onUrlPlaceCodeChange: PlaceCodeChangeHandler;
    children: ReactNode;
}) {
    const {
        event,
        urlPlaceCode,
        onUrlPlaceCodeChange,
        children,
    } = props;

    const countryCodeIso3 = parseCountryCode(event?.countryCodeIso3);

    const { response: countries } = useNrwRequest({
        url: '/countries',
        apiType: 'nrw',
    });
    const adminLevelLabels = countries
        ?.find((country) => country.countryCodeIso3 === countryCodeIso3)
        ?.adminLevelLabels;

    // When the event changes, the drill starts again at the top.
    const [drill, setDrill] = useState(() => newDrill(event));
    if (drill.eventId !== event?.eventId) {
        setDrill(newDrill(event));
    }

    // Only the exposed admin levels of the event can be drilled into, starting
    // at the level where the exposure splits into several areas.
    const initialAdminLevel = isDefined(event) ? getNrwInitialAdminLevel(event) : minAdminLevel;
    const adminLevel = (initialAdminLevel + drill.shown.path.length) as AdminLevel;

    const allExposedPlaceCodes = useMemo(
        () => (isDefined(event) ? getNrwAllExposedPlaceCodes(event) : new Set<string>()),
        [event],
    );

    const urlAdminArea = useMemo(
        () => (isDefined(event) && isDefined(urlPlaceCode)
            ? getExposedAdminArea(event, urlPlaceCode)
            : undefined),
        [event, urlPlaceCode],
    );

    const { request, lookup } = getAdminAreasRequest(event, initialAdminLevel, urlAdminArea, drill);
    const shownAgain = isSameAdminAreasRequest(request, drill.shown.request);
    const skip = request.placeCodes?.length === 0 || shownAgain;

    // The admin area in the url is selected when it is on the level shown again, not its parent.
    const selectedAdminArea = shownAgain && urlAdminArea?.adminLevel === request.adminLevel
        ? urlAdminArea
        : undefined;

    // Stay on the shown level when the requested admin areas do not load.
    const shownPlaceCode = drill.shown.path.at(-1)?.placeCode;

    const { pending } = useNrwAdminAreas({
        countries: countryCodeIso3 === null ? undefined : [countryCodeIso3],
        adminLevel: request.adminLevel,
        parentPlaceCode: request.parentPlaceCode,
        placeCodes: request.placeCodes,
        skip,
        onSuccess: (adminAreas) => {
            // A request skipped while it loads can still answer.
            if (skip || isNotDefined(event)) {
                return;
            }
            const [adminArea] = adminAreas.features;

            if (lookup) {
                const [lookedUpPlaceCode] = request.placeCodes ?? [];
                if (isNotDefined(adminArea) || isNotDefined(lookedUpPlaceCode)) {
                    onUrlPlaceCodeChange(shownPlaceCode);
                    return;
                }
                const parentPlaceCode = getNrwDrillPath(
                    event,
                    initialAdminLevel,
                    adminArea.properties,
                ).at(-1)?.placeCode;
                setDrill((previous) => ({
                    ...previous,
                    lookedUp: { placeCode: lookedUpPlaceCode, parentPlaceCode },
                }));
                return;
            }

            const exposedAdminArea = adminAreas.features.find(
                ({ properties }) => allExposedPlaceCodes.has(properties.placeCode),
            );
            if (isDefined(exposedAdminArea)) {
                const path = getNrwDrillPath(event, initialAdminLevel, exposedAdminArea.properties);
                setDrill((previous) => ({ ...previous, shown: { request, path, adminAreas } }));
                return;
            }

            // An admin area without exposed children is the deepest level: remember it,
            // so it is selected.
            const { parentPlaceCode } = request;
            if (isDefined(parentPlaceCode) && parentPlaceCode === urlAdminArea?.placeCode) {
                setDrill((previous) => ({
                    ...previous,
                    childlessPlaceCodes: [...previous.childlessPlaceCodes, parentPlaceCode],
                }));
                return;
            }
            onUrlPlaceCodeChange(shownPlaceCode);
        },
        onFailure: () => {
            if (!skip) {
                onUrlPlaceCodeChange(shownPlaceCode);
            }
        },
    });

    const shownPath = drill.shown.path;
    const unselectedAdminAreasRequests = getUnselectedAdminAreasRequests(event, shownPath);
    const { response: unselectedAdminAreasResponse } = useNrwRequest({
        url: '/admin-areas',
        apiType: 'nrw',
        skip: countryCodeIso3 === null || unselectedAdminAreasRequests.length === 0,
        query: getAdminAreasOfRequestsQuery(
            countryCodeIso3 === null ? [] : [countryCodeIso3],
            unselectedAdminAreasRequests,
        ),
        preserveResponse: true,
    });

    const shownLevelAdminAreas = drill.shown.adminAreas;
    // Apart from the admin areas beside the drill path, as the map fits to these: a new object
    // when those load would undo the map view of a link.
    const exposedAdminAreas = useMemo(
        () => getFeatureCollection((shownLevelAdminAreas?.features ?? []).filter(
            (feature) => isExposed(allExposedPlaceCodes, feature),
        )),
        [allExposedPlaceCodes, shownLevelAdminAreas],
    );
    const { unselectedAdminAreas, unexposedAdminAreas } = useMemo(
        () => {
            const shownLevelFeatures = shownLevelAdminAreas?.features ?? [];
            const besidePathFeatures = getAdminAreasBesidePath(
                unselectedAdminAreasResponse,
                shownPath,
                initialAdminLevel,
            );

            // Beside the drill path, exposed or not, all admin areas show as unselected:
            // only on the shown level are the unexposed ones set apart.
            return {
                unselectedAdminAreas: getFeatureCollection(besidePathFeatures),
                unexposedAdminAreas: getFeatureCollection(shownLevelFeatures.filter(
                    (feature) => !isExposed(allExposedPlaceCodes, feature),
                )),
            };
        },
        [
            allExposedPlaceCodes,
            shownLevelAdminAreas,
            unselectedAdminAreasResponse,
            shownPath,
            initialAdminLevel,
        ],
    );

    const [hoveredPlaceCode, setHoveredPlaceCode] = useState<PlaceCode>();

    const exposedPopulationScale = useMemo(
        () => (isDefined(event) && isDefined(exposedAdminAreas)
            ? getExposedPopulationScale(event, exposedAdminAreas)
            : undefined),
        [event, exposedAdminAreas],
    );

    const value = useMemo<NrwAdminAreasContextProps>(
        () => {
            const { shown } = drill;

            function canDrillDown(placeCode: PlaceCode) {
                return placeCode !== selectedAdminArea?.placeCode
                    && allExposedPlaceCodes.has(placeCode);
            }

            function drillUpTo(targetAdminLevel: AdminLevel) {
                const parentAdminArea = shown.path[targetAdminLevel - initialAdminLevel - 1];
                onUrlPlaceCodeChange(parentAdminArea?.placeCode);
            }

            return {
                initialAdminLevel,
                adminLevel,
                adminLevelLabels,
                adminAreas: exposedAdminAreas,
                unselectedAdminAreas,
                unexposedAdminAreas,
                exposedPopulationScale,
                pending,
                drillPath: isDefined(selectedAdminArea)
                    ? [...shown.path, selectedAdminArea]
                    : shown.path,
                parentAdminArea: shown.path.at(-1),
                selectedAdminArea,
                hoveredPlaceCode,
                onAdminAreaHoverChange: setHoveredPlaceCode,
                isExposed: (placeCode) => allExposedPlaceCodes.has(placeCode),
                canDrillDown,
                drillDown: (adminArea) => {
                    onUrlPlaceCodeChange(adminArea.placeCode);
                },
                drillUp: () => {
                    if (isDefined(selectedAdminArea)) {
                        onUrlPlaceCodeChange(shownPlaceCode);
                    } else if (adminLevel > initialAdminLevel) {
                        drillUpTo((adminLevel - 1) as AdminLevel);
                    }
                },
                drillUpTo,
            };
        },
        [
            drill,
            allExposedPlaceCodes,
            exposedAdminAreas,
            unselectedAdminAreas,
            unexposedAdminAreas,
            exposedPopulationScale,
            selectedAdminArea,
            shownPlaceCode,
            initialAdminLevel,
            adminLevel,
            adminLevelLabels,
            pending,
            hoveredPlaceCode,
            onUrlPlaceCodeChange,
        ],
    );

    return (
        <NrwAdminAreasContext.Provider value={value}>
            {children}
        </NrwAdminAreasContext.Provider>
    );
}

export default NrwAdminAreasProvider;
