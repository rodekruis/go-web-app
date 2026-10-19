import {
    type ReactNode,
    useMemo,
    useState,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import { getExposedPopulationScale } from '#utils/nrw/colors';
import {
    canNrwDrillBelow,
    getNrwDrillableAdminArea,
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

interface Drill {
    eventId: NrwEvent['eventId'] | undefined;
    shown: {
        path: AdminAreaProperties[];
        adminAreas: NrwAdminAreaFeatureCollection | undefined;
    };
    childlessPlaceCodes: PlaceCode[];
}

function newDrill(event: NrwEvent | undefined): Drill {
    return {
        eventId: event?.eventId,
        shown: { path: [], adminAreas: undefined },
        childlessPlaceCodes: [],
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

    // The admin areas below the admin area in the url are requested, when the
    // event exposes it and it can be drilled into, else the initial level.
    const requestedAdminArea = isDefined(event) && isDefined(urlPlaceCode)
        ? getNrwDrillableAdminArea(event, urlPlaceCode)
        : undefined;
    const requestedAdminLevel = isDefined(requestedAdminArea)
        ? (requestedAdminArea.adminLevel + 1) as AdminLevel
        : initialAdminLevel;
    const exposedPlaceCodes = isDefined(event)
        ? getNrwExposedPlaceCodes(event, requestedAdminLevel)
        : [];

    // Stay on the shown level when the requested admin areas do not load.
    const shownPlaceCode = drill.shown.path.at(-1)?.placeCode;

    const { pending } = useNrwAdminAreas({
        countries: countryCodeIso3 === null ? undefined : [countryCodeIso3],
        adminLevel: requestedAdminLevel,
        parentPlaceCode: requestedAdminArea?.placeCode,
        placeCodes: exposedPlaceCodes,
        skip: exposedPlaceCodes.length === 0,
        onSuccess: (adminAreas) => {
            const [adminArea] = adminAreas.features;
            if (isDefined(adminArea) && isDefined(event)) {
                const path = getNrwDrillPath(event, initialAdminLevel, adminArea.properties);
                setDrill((previous) => ({ ...previous, shown: { path, adminAreas } }));
                return;
            }

            // An admin area without children is the deepest level, so stay on
            // the shown level and remember it, so it is not requested again.
            if (isDefined(requestedAdminArea)) {
                setDrill((previous) => ({
                    ...previous,
                    childlessPlaceCodes: [
                        ...previous.childlessPlaceCodes,
                        requestedAdminArea.placeCode,
                    ],
                }));
            }
            onUrlPlaceCodeChange(shownPlaceCode);
        },
        onFailure: () => onUrlPlaceCodeChange(shownPlaceCode),
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
                drillPath: shown.path,
                parentAdminArea: shown.path.at(-1),
                hoveredPlaceCode,
                onAdminAreaHoverChange: setHoveredPlaceCode,
                canDrillDown,
                drillDown: (adminArea) => {
                    if (canDrillDown(adminArea.placeCode)) {
                        onUrlPlaceCodeChange(adminArea.placeCode);
                    }
                },
                drillUp: () => {
                    if (adminLevel > initialAdminLevel) {
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
