import {
    useCallback,
    useRef,
    useState,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import {
    type AdminLevel,
    type CountryCodeIso3,
    type NrwAdminAreaFeatureCollection,
    type PlaceCode,
} from '#views/CountryProfileNationalRiskWatch/types';
import { maxQueryableAdminLevel } from '#views/CountryProfileNationalRiskWatch/utils';

// The whole country is one area, so start one level down.
const defaultMinAdminLevel = 1 as AdminLevel;

// Track the admin area drilled into, as a path of place codes
// from the top admin level down. Only the given admin levels can be
// drilled into, starting at the least granular one.
function useAdminAreaDrill(countryCodeIso3: CountryCodeIso3, adminLevels: AdminLevel[]) {
    // The path is kept with its country, so a country change starts over at the top.
    const [drill, setDrill] = useState<{
        countryCodeIso3: CountryCodeIso3;
        path: PlaceCode[];
    }>({ countryCodeIso3, path: [] });

    // The admin areas found to have no children, so they are not fetched again.
    const childlessPlaceCodes = useRef(new Set<PlaceCode>());

    const drillPath = drill.countryCodeIso3 === countryCodeIso3 ? drill.path : [];
    const parentPlaceCode = drillPath[drillPath.length - 1];
    const minAdminLevel = adminLevels[0] ?? defaultMinAdminLevel;
    const adminLevel = (minAdminLevel + drillPath.length) as AdminLevel;

    const setDrillPath = useCallback(
        (update: (path: PlaceCode[]) => PlaceCode[]) => {
            setDrill((previous) => ({
                countryCodeIso3,
                path: update(previous.countryCodeIso3 === countryCodeIso3 ? previous.path : []),
            }));
        },
        [countryCodeIso3],
    );

    const drillDown = useCallback(
        (placeCode: PlaceCode) => {
            const nextAdminLevel = adminLevel + 1;
            if (
                nextAdminLevel <= maxQueryableAdminLevel
                && adminLevels.includes(nextAdminLevel as AdminLevel)
                && !childlessPlaceCodes.current.has(placeCode)
            ) {
                setDrillPath((path) => [...path, placeCode]);
            }
        },
        [setDrillPath, adminLevel, adminLevels],
    );

    const drillUp = useCallback(
        () => setDrillPath((path) => path.slice(0, -1)),
        [setDrillPath],
    );

    // An admin area without children is the finest level, so stay on its level.
    const handleAdminAreasSuccess = useCallback(
        (adminAreas: NrwAdminAreaFeatureCollection) => {
            if (adminAreas.features.length === 0) {
                if (isDefined(parentPlaceCode)) {
                    childlessPlaceCodes.current.add(parentPlaceCode);
                }
                drillUp();
            }
        },
        [drillUp, parentPlaceCode],
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
