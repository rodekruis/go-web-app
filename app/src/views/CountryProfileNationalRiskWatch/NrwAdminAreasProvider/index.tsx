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
    getNrwDrillPath,
    getNrwExposedPlaceCodes,
    getNrwInitialAdminLevel,
} from '#utils/nrw/events';
import { useNrwRequest } from '#utils/restRequest';

import useNrwAdminAreas from '../hooks/useNrwAdminAreas';
import {
    type AdminAreaProperties,
    type AdminLevel,
    type NrwAdminAreaFeatureCollection,
    type NrwEvent,
    type PlaceCode,
    type PlaceCodeChangeHandler,
} from '../types';
import { parseCountryCode } from '../utils';
import NrwAdminAreasContext, { type NrwAdminAreasContextProps } from './NrwAdminAreasContext';

interface AdminAreasRequest {
    adminLevel: AdminLevel;
    parentPlaceCode: PlaceCode | undefined;
    placeCodes: PlaceCode[];
}

function isSameAdminAreasRequest(request: AdminAreasRequest, other: AdminAreasRequest | undefined) {
    return isDefined(other)
        && request.adminLevel === other.adminLevel
        && request.parentPlaceCode === other.parentPlaceCode
        && request.placeCodes.length === other.placeCodes.length
        && request.placeCodes.every((placeCode, index) => placeCode === other.placeCodes[index]);
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
    // A request for the exposed admin areas of a level under one parent.
    const level = (adminLevel: AdminLevel, parentPlaceCode: PlaceCode | undefined) => ({
        adminLevel,
        parentPlaceCode,
        placeCodes: isDefined(event) ? getNrwExposedPlaceCodes(event, adminLevel) : [],
    });

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
    const initialAdminLevel = isDefined(event) ? getNrwInitialAdminLevel(event) : 1 as AdminLevel;
    const adminLevel = (initialAdminLevel + drill.shown.path.length) as AdminLevel;

    const urlAdminArea = useMemo(
        () => (isDefined(event) && isDefined(urlPlaceCode)
            ? getExposedAdminArea(event, urlPlaceCode)
            : undefined),
        [event, urlPlaceCode],
    );

    const { request, lookup } = getAdminAreasRequest(event, initialAdminLevel, urlAdminArea, drill);
    const shownAgain = isSameAdminAreasRequest(request, drill.shown.request);
    const skip = request.placeCodes.length === 0 || shownAgain;

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
                if (isNotDefined(adminArea)) {
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
                    lookedUp: { placeCode: request.placeCodes[0] as PlaceCode, parentPlaceCode },
                }));
                return;
            }

            if (isDefined(adminArea)) {
                const path = getNrwDrillPath(event, initialAdminLevel, adminArea.properties);
                setDrill((previous) => ({ ...previous, shown: { request, path, adminAreas } }));
                return;
            }

            // An admin area without children is the deepest level: remember it, so it is selected.
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

    const [hoveredPlaceCode, setHoveredPlaceCode] = useState<PlaceCode>();

    const shownAdminAreas = drill.shown.adminAreas;
    const exposedPopulationScale = useMemo(
        () => (isDefined(event) && isDefined(shownAdminAreas)
            ? getExposedPopulationScale(event, shownAdminAreas)
            : undefined),
        [event, shownAdminAreas],
    );

    const value = useMemo<NrwAdminAreasContextProps>(
        () => {
            const { shown, childlessPlaceCodes } = drill;

            function canDrillDown(placeCode: PlaceCode) {
                return placeCode !== selectedAdminArea?.placeCode;
            }

            function hasChildren(placeCode: PlaceCode) {
                return isDefined(event)
                    && canNrwDrillBelow(event, adminLevel)
                    && !childlessPlaceCodes.includes(placeCode);
            }

            function drillUpTo(targetAdminLevel: AdminLevel) {
                const parentAdminArea = shown.path[targetAdminLevel - initialAdminLevel - 1];
                onUrlPlaceCodeChange(parentAdminArea?.placeCode);
            }

            return {
                initialAdminLevel,
                adminLevel,
                adminLevelLabels,
                adminAreas: shown.adminAreas,
                exposedPopulationScale,
                pending,
                drillPath: isDefined(selectedAdminArea)
                    ? [...shown.path, selectedAdminArea]
                    : shown.path,
                parentAdminArea: shown.path.at(-1),
                selectedAdminArea,
                hoveredPlaceCode,
                onAdminAreaHoverChange: setHoveredPlaceCode,
                canDrillDown,
                hasChildren,
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
            event,
            drill,
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
