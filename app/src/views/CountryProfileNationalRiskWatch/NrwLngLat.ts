import { LngLat } from 'mapbox-gl';

import {
    type Latitude,
    type Longitude,
} from './types';

// Subclassed to add types.
export default class NrwLngLat extends LngLat {
    declare lng: Longitude;

    declare lat: Latitude;

    // eslint-disable-next-line no-useless-constructor -- We add types, so it's not useless.
    constructor(longitude: Longitude, latitude: Latitude) {
        super(longitude, latitude);
    }
}
