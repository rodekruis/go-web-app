import {
    type ReactNode,
    useMemo,
    useState,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import { getExposedPopulationScale } from '#utils/nrw/colors';
import {
    getNrwAllExposedPlaceCodes,
    getNrwExposedAdminLevels,
    getNrwExposedPlaceCodes,
    getNrwInitialAdminLevel,
} from '#utils/nrw/events';
import { useNrwRequest } from '#utils/restRequest';

import useNrwAdminAreas from '../hooks/useNrwAdminAreas';
import {
    type AdminAreaProperties,
    type AdminLevel,
    type NrwAdminAreaFeature,
    type NrwAdminAreaFeatureCollection,
    type NrwEvent,
    type PlaceCode,
} from '../types';
import {
    maxQueryableAdminLevel,
    parseCountryCode,
} from '../utils';
import NrwAdminAreasContext, { type NrwAdminAreasContextProps } from './NrwAdminAreasContext';

interface Drill {
    eventId: NrwEvent['eventId'] | undefined;
    path: AdminAreaProperties[];
    shown: {
        path: AdminAreaProperties[];
        adminAreas: NrwAdminAreaFeatureCollection | undefined;
        higherLevelAdminAreas: NrwAdminAreaFeature[];
    };
    childlessPlaceCodes: PlaceCode[];
}

function newDrill(event: NrwEvent | undefined): Drill {
    return {
        eventId: event?.eventId,
        path: [],
        shown: { path: [], adminAreas: undefined, higherLevelAdminAreas: [] },
        childlessPlaceCodes: [],
    };
}

// The admin areas drilled through so far that lie above the given admin level.
function getHigherLevelAdminAreas(
    shown: Drill['shown'],
    adminLevel: AdminLevel,
): NrwAdminAreaFeature[] {
    return [...shown.higherLevelAdminAreas, ...(shown.adminAreas?.features ?? [])]
        .filter((feature) => feature.properties.adminLevel < adminLevel);
}

function getFeatureCollection(
    features: NrwAdminAreaFeature[],
): NrwAdminAreaFeatureCollection | undefined {
    return features.length > 0 ? { type: 'FeatureCollection', features } : undefined;
}

function NrwAdminAreasProvider(props: {
    event: NrwEvent | undefined;
    children: ReactNode;
}) {
    const { event, children } = props;

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
    const requestedAdminLevel = (initialAdminLevel + drill.path.length) as AdminLevel;
    const exposedPlaceCodes = isDefined(event)
        ? getNrwExposedPlaceCodes(event, requestedAdminLevel)
        : [];
    const allExposedPlaceCodes = useMemo(
        () => (isDefined(event) ? getNrwAllExposedPlaceCodes(event) : new Set<string>()),
        [event],
    );

    const parentAdminArea = drill.path.at(-1);

    // Below the initial level, request all children of the parent, so the unexposed ones
    // can be shown as well.
    const { pending } = useNrwAdminAreas({
        countries: countryCodeIso3 === null ? undefined : [countryCodeIso3],
        adminLevel: requestedAdminLevel,
        parentPlaceCode: parentAdminArea?.placeCode,
        placeCodes: isDefined(parentAdminArea) ? undefined : exposedPlaceCodes,
        skip: exposedPlaceCodes.length === 0,
        onSuccess: (adminAreas) => setDrill((previous) => {
            const hasExposedAdminAreas = adminAreas.features.some(
                ({ properties }) => allExposedPlaceCodes.has(properties.placeCode),
            );

            if (hasExposedAdminAreas) {
                const shownAdminLevel = (initialAdminLevel + previous.path.length) as AdminLevel;
                return {
                    ...previous,
                    shown: {
                        path: previous.path,
                        adminAreas,
                        higherLevelAdminAreas: getHigherLevelAdminAreas(
                            previous.shown,
                            shownAdminLevel,
                        ),
                    },
                };
            }

            // An admin area without exposed children is the deepest level, so stay on
            // the shown level and remember it, so it is not requested again.
            const requestedAdminArea = previous.path.at(-1);
            return {
                ...previous,
                path: previous.shown.path,
                childlessPlaceCodes: isDefined(requestedAdminArea)
                    ? [...previous.childlessPlaceCodes, requestedAdminArea.placeCode]
                    : previous.childlessPlaceCodes,
            };
        }),
        // Stay on the shown level when the requested admin areas do not load.
        onFailure: () => setDrill((previous) => ({ ...previous, path: previous.shown.path })),
    });

    const [hoveredPlaceCode, setHoveredPlaceCode] = useState<PlaceCode>();

    // The exposed admin areas of the shown level are selectable. The unselected ones are
    // the exposed ones around the drill path, up to the initial level. The unexposed ones
    // are those of the shown level and around the drill path.
    const { exposedAdminAreas, unselectedAdminAreas, unexposedAdminAreas } = useMemo(
        () => {
            const selectedPlaceCodes: string[] = drill.shown.path.map(
                ({ placeCode }) => placeCode,
            );
            const { higherLevelAdminAreas } = drill.shown;
            const shownLevelAdminAreas = drill.shown.adminAreas?.features ?? [];
            const isExposed = ({ properties }: NrwAdminAreaFeature) => (
                allExposedPlaceCodes.has(properties.placeCode)
            );

            return {
                exposedAdminAreas: getFeatureCollection(shownLevelAdminAreas.filter(isExposed)),
                unselectedAdminAreas: getFeatureCollection(higherLevelAdminAreas.filter(
                    (feature) => isExposed(feature)
                        && !selectedPlaceCodes.includes(feature.properties.placeCode),
                )),
                unexposedAdminAreas: getFeatureCollection(
                    [...higherLevelAdminAreas, ...shownLevelAdminAreas]
                        .filter((feature) => !isExposed(feature)),
                ),
            };
        },
        [drill.shown, allExposedPlaceCodes],
    );

    const exposedPopulationScale = useMemo(
        () => (isDefined(event) && isDefined(exposedAdminAreas)
            ? getExposedPopulationScale(event, exposedAdminAreas)
            : undefined),
        [event, exposedAdminAreas],
    );

    const value = useMemo<NrwAdminAreasContextProps>(
        () => {
            const exposedAdminLevels = isDefined(event) ? getNrwExposedAdminLevels(event) : [];
            const { shown, childlessPlaceCodes } = drill;

            function canDrillDown(adminArea: AdminAreaProperties) {
                const nextAdminLevel = (adminArea.adminLevel + 1) as AdminLevel;

                return nextAdminLevel <= maxQueryableAdminLevel
                    && exposedAdminLevels.includes(nextAdminLevel)
                    && allExposedPlaceCodes.has(adminArea.placeCode)
                    && !childlessPlaceCodes.includes(adminArea.placeCode);
            }

            // The part of the drill path above the given admin level.
            function getPathAbove(path: AdminAreaProperties[], targetAdminLevel: AdminLevel) {
                return path.slice(0, targetAdminLevel - initialAdminLevel);
            }

            function drillUpTo(targetAdminLevel: AdminLevel) {
                setDrill((previous) => ({
                    ...previous,
                    path: getPathAbove(previous.shown.path, targetAdminLevel),
                }));
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
                drillPath: shown.path,
                parentAdminArea: shown.path.at(-1),
                hoveredPlaceCode,
                onAdminAreaHoverChange: setHoveredPlaceCode,
                canDrillDown,
                // An unselected admin area drills sideways, and up if above the parent level.
                drillDown: (adminArea) => {
                    if (canDrillDown(adminArea)) {
                        setDrill((previous) => ({
                            ...previous,
                            path: [
                                ...getPathAbove(previous.shown.path, adminArea.adminLevel),
                                adminArea,
                            ],
                        }));
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
            allExposedPlaceCodes,
            exposedAdminAreas,
            unselectedAdminAreas,
            unexposedAdminAreas,
            exposedPopulationScale,
            initialAdminLevel,
            adminLevel,
            adminLevelLabels,
            pending,
            hoveredPlaceCode,
        ],
    );

    return (
        <NrwAdminAreasContext.Provider value={value}>
            {children}
        </NrwAdminAreasContext.Provider>
    );
}

export default NrwAdminAreasProvider;
