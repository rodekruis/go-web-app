import {
    faHouseFloodWater,
    faHurricane,
    faSunPlantWilt,
    type IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';

import { type NrwEventHazardType } from '#views/CountryProfileNationalRiskWatch/types';

const hazardIcons: Record<NrwEventHazardType, IconDefinition> = {
    floods: faHouseFloodWater,
    compoundFloods: faHouseFloodWater,
    drought: faSunPlantWilt,
    tropicalCyclone: faHurricane,
};

export default hazardIcons;
