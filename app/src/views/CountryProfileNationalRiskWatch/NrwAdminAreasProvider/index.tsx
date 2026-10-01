import {
    type ReactNode,
    useMemo,
    useState,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import {
    getNrwExposedAdminLevels,
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
    };
    childlessPlaceCodes: PlaceCode[];
}

function newDrill(event: NrwEvent | undefined): Drill {
    return {
        eventId: event?.eventId,
        path: [],
        shown: { path: [], adminAreas: undefined },
        childlessPlaceCodes: [],
    };
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
    const minAdminLevel = isDefined(event) ? getNrwInitialAdminLevel(event) : 1 as AdminLevel;
    const adminLevel = (minAdminLevel + drill.shown.path.length) as AdminLevel;
    const requestedAdminLevel = (minAdminLevel + drill.path.length) as AdminLevel;
    const exposedPlaceCodes = isDefined(event)
        ? getNrwExposedPlaceCodes(event, requestedAdminLevel)
        : [];

    const { pending } = useNrwAdminAreas({
        countries: countryCodeIso3 === null ? undefined : [countryCodeIso3],
        adminLevel: requestedAdminLevel,
        parentPlaceCode: drill.path.at(-1)?.placeCode,
        placeCodes: exposedPlaceCodes,
        skip: exposedPlaceCodes.length === 0,
        onSuccess: (adminAreas) => setDrill((previous) => {
            if (adminAreas.features.length > 0) {
                return { ...previous, shown: { path: previous.path, adminAreas } };
            }

            // An admin area without children is the finest level, so stay on
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

    const value = useMemo<NrwAdminAreasContextProps>(
        () => {
            const exposedAdminLevels = isDefined(event) ? getNrwExposedAdminLevels(event) : [];
            const { shown, childlessPlaceCodes } = drill;

            function canDrillDown(placeCode: PlaceCode) {
                const nextAdminLevel = (adminLevel + 1) as AdminLevel;

                return nextAdminLevel <= maxQueryableAdminLevel
                    && exposedAdminLevels.includes(nextAdminLevel)
                    && !childlessPlaceCodes.includes(placeCode);
            }

            return {
                adminLevel,
                adminLevelLabels,
                adminAreas: shown.adminAreas,
                pending,
                parentAdminArea: shown.path.at(-1),
                hoveredPlaceCode,
                onAdminAreaHoverChange: setHoveredPlaceCode,
                canDrillDown,
                drillDown: (adminArea) => {
                    if (canDrillDown(adminArea.placeCode)) {
                        setDrill((previous) => ({
                            ...previous,
                            path: [...previous.shown.path, adminArea],
                        }));
                    }
                },
                drillUp: () => {
                    if (shown.path.length > 0) {
                        setDrill((previous) => ({
                            ...previous,
                            path: previous.shown.path.slice(0, -1),
                        }));
                    }
                },
            };
        },
        [event, drill, adminLevel, adminLevelLabels, pending, hoveredPlaceCode],
    );

    return (
        <NrwAdminAreasContext.Provider value={value}>
            {children}
        </NrwAdminAreasContext.Provider>
    );
}

export default NrwAdminAreasProvider;
