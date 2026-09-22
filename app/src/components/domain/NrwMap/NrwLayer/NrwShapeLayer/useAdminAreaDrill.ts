import {
    useCallback,
    useState,
} from 'react';

import {
    type AdminLevel,
    type CountryCodeIso3,
    type NrwAdminAreaFeatureCollection,
    type PlaceCode,
} from '#views/CountryProfileNationalRiskWatch/types';

// The whole country is one area, so start one level down.
const topAdminLevel = 1 as AdminLevel;

// Track the admin area drilled into, as a path of place codes
// from the top admin level down.
function useAdminAreaDrill(countryCodeIso3: CountryCodeIso3) {
    // The path is kept with its country, so a country change starts over at the top.
    const [drill, setDrill] = useState<{
        countryCodeIso3: CountryCodeIso3;
        path: PlaceCode[];
    }>({ countryCodeIso3, path: [] });

    const drillPath = drill.countryCodeIso3 === countryCodeIso3 ? drill.path : [];
    const parentPlaceCode = drillPath[drillPath.length - 1];
    const adminLevel = (topAdminLevel + drillPath.length) as AdminLevel;

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
        (placeCode: PlaceCode) => setDrillPath((path) => [...path, placeCode]),
        [setDrillPath],
    );

    const drillUp = useCallback(
        () => setDrillPath((path) => path.slice(0, -1)),
        [setDrillPath],
    );

    // An admin area without children is the finest level, so stay on its level.
    const handleAdminAreasSuccess = useCallback(
        (adminAreas: NrwAdminAreaFeatureCollection) => {
            if (adminAreas.features.length === 0) {
                drillUp();
            }
        },
        [drillUp],
    );

    return {
        adminLevel,
        parentPlaceCode,
        drillDown,
        drillUp,
        handleAdminAreasSuccess,
    };
}

export default useAdminAreaDrill;
