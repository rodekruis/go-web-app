import {
    useCallback,
    useState,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import {
    type AdminLevel,
    type NrwAdminAreaFeatureCollection,
    type NrwEvent,
    type PlaceCode,
} from '#views/CountryProfileNationalRiskWatch/types';
import { maxQueryableAdminLevel } from '#views/CountryProfileNationalRiskWatch/utils';

// The whole country is one area, so start one level down.
const defaultMinAdminLevel = 1 as AdminLevel;

interface DrillState {
    eventId: NrwEvent['eventId'] | undefined;
    // The place codes drilled into, from the top admin level down.
    path: PlaceCode[];
    // The admin areas found to have no children.
    childlessPlaceCodes: PlaceCode[];
}

// Track the admin area drilled into, as a path of place codes
// from the top admin level down. Only the given admin levels can be
// drilled into, starting at the least granular one.
function useAdminAreaDrill(eventId: NrwEvent['eventId'] | undefined, adminLevels: AdminLevel[]) {
    // The drill state is kept with its event, so an event change starts over
    // at the top with no memory of the last event, as the exposed areas differ.
    const [drill, setDrill] = useState<DrillState>(
        () => ({ eventId, path: [], childlessPlaceCodes: [] }),
    );

    const { path: drillPath, childlessPlaceCodes }: DrillState = drill.eventId === eventId
        ? drill
        : { eventId, path: [], childlessPlaceCodes: [] };
    const parentPlaceCode = drillPath[drillPath.length - 1];
    const minAdminLevel = adminLevels[0] ?? defaultMinAdminLevel;
    const adminLevel = (minAdminLevel + drillPath.length) as AdminLevel;

    const updateDrill = useCallback(
        (update: (state: DrillState) => Partial<DrillState>) => {
            setDrill((previous) => {
                const current = previous.eventId === eventId
                    ? previous
                    : { eventId, path: [], childlessPlaceCodes: [] };
                return { ...current, ...update(current) };
            });
        },
        [eventId],
    );

    const drillDown = useCallback(
        (placeCode: PlaceCode) => {
            const nextAdminLevel = adminLevel + 1;
            if (
                nextAdminLevel <= maxQueryableAdminLevel
                && adminLevels.includes(nextAdminLevel as AdminLevel)
                && !childlessPlaceCodes.includes(placeCode)
            ) {
                updateDrill(({ path }) => ({ path: [...path, placeCode] }));
            }
        },
        [updateDrill, adminLevel, adminLevels, childlessPlaceCodes],
    );

    const drillUp = useCallback(
        () => updateDrill(({ path }) => ({ path: path.slice(0, -1) })),
        [updateDrill],
    );

    // An admin area without children is the finest level, so stay on its level
    // and remember it, so it is not fetched again.
    const handleAdminAreasSuccess = useCallback(
        (adminAreas: NrwAdminAreaFeatureCollection) => {
            if (adminAreas.features.length === 0) {
                updateDrill((state) => ({
                    path: state.path.slice(0, -1),
                    childlessPlaceCodes: isDefined(parentPlaceCode)
                        ? [...state.childlessPlaceCodes, parentPlaceCode]
                        : state.childlessPlaceCodes,
                }));
            }
        },
        [updateDrill, parentPlaceCode],
    );

    return {
        adminLevel,
        parentPlaceCode,
        drillDown,
        drillUp,
        handleAdminAreasSuccess,
        handleAdminAreasFailure: drillUp,
    };
}

export default useAdminAreaDrill;
