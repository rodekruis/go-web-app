import { createContext } from 'react';

import { type NrwExposedPopulationScale } from '#utils/nrw/colors';

import {
    type AdminAreaDrillDownHandler,
    type AdminAreaProperties,
    type AdminLevel,
    type AdminLevelDrillHandler,
    type NrwAdminAreaFeatureCollection,
    type NrwAdminLevelLabels,
    type PlaceCode,
    type PlaceCodeChangeHandler,
} from '../types';
import { minAdminLevel } from '../utils';

export interface NrwAdminAreasContextProps {
    initialAdminLevel: AdminLevel;
    adminLevel: AdminLevel;
    adminLevelLabels: NrwAdminLevelLabels | undefined;
    adminAreas: NrwAdminAreaFeatureCollection | undefined;
    unselectedAdminAreas: NrwAdminAreaFeatureCollection | undefined;
    unexposedAdminAreas: NrwAdminAreaFeatureCollection | undefined;
    exposedPopulationScale: NrwExposedPopulationScale | undefined;
    pending: boolean;
    drillPath: AdminAreaProperties[];
    parentAdminArea: AdminAreaProperties | undefined;
    selectedAdminArea: AdminAreaProperties | undefined;
    hoveredPlaceCode: PlaceCode | undefined;
    onAdminAreaHoverChange: PlaceCodeChangeHandler;
    canDrillDown: (placeCode: PlaceCode) => boolean;
    hasChildren: (placeCode: PlaceCode) => boolean;
    drillDown: AdminAreaDrillDownHandler;
    drillUp: () => void;
    drillUpTo: AdminLevelDrillHandler;
}

const NrwAdminAreasContext = createContext<NrwAdminAreasContextProps>({
    initialAdminLevel: minAdminLevel,
    adminLevel: minAdminLevel,
    adminLevelLabels: undefined,
    adminAreas: undefined,
    unselectedAdminAreas: undefined,
    unexposedAdminAreas: undefined,
    exposedPopulationScale: undefined,
    pending: false,
    drillPath: [],
    parentAdminArea: undefined,
    selectedAdminArea: undefined,
    hoveredPlaceCode: undefined,
    onAdminAreaHoverChange: () => {
        // eslint-disable-next-line no-console
        console.warn('NrwAdminAreasContext::onAdminAreaHoverChange called before it was initialized');
    },
    canDrillDown: () => false,
    hasChildren: () => false,
    drillDown: () => {
        // eslint-disable-next-line no-console
        console.warn('NrwAdminAreasContext::drillDown called before it was initialized');
    },
    drillUp: () => {
        // eslint-disable-next-line no-console
        console.warn('NrwAdminAreasContext::drillUp called before it was initialized');
    },
    drillUpTo: () => {
        // eslint-disable-next-line no-console
        console.warn('NrwAdminAreasContext::drillUpTo called before it was initialized');
    },
});

export default NrwAdminAreasContext;
