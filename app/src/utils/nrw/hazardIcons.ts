import {
    faHouseFloodWater,
    faHurricane,
    faSunPlantWilt,
    type IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';

import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

const hazardIcons: Record<NrwEvent['hazardType'], IconDefinition> = {
    floods: faHouseFloodWater,
    drought: faSunPlantWilt,
    tropicalCyclone: faHurricane,
};

export default hazardIcons;
