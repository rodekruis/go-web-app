import { useMemo } from 'react';
import { isDefined } from '@togglecorp/fujs';

import NrwLngLat from '../NrwLngLat';
import {
    type AdminLevel,
    type CountryCodeIso3,
    type Latitude,
    type Longitude,
    type MapView,
    type Zoom,
} from '../types';
import {
    getFeatureCollectionBounds,
    getMapView,
} from '../utils';
import useNrwAdminAreas from './useNrwAdminAreas';

const defaultZoom = 3 as Zoom;
const defaultLatitude = 0 as Latitude;
const defaultLongitude = 0 as Longitude;

const defaultMapView: MapView = {
    center: new NrwLngLat(defaultLongitude, defaultLatitude),
    zoom: defaultZoom,
};

function useNrwMapView(props: {
    urlZoom: Zoom | null;
    urlLatitude: Latitude | null;
    urlLongitude: Longitude | null;
    countries: CountryCodeIso3[] | undefined;
    countriesPending: boolean;
}): MapView {
    const {
        urlZoom,
        urlLatitude,
        urlLongitude,
        countries,
        countriesPending,
    } = props;

    // Set from the longitude/latitude search params when they are present.
    const urlMapView = getMapView(urlLatitude, urlLongitude, urlZoom ?? defaultZoom);

    const { adminAreas } = useNrwAdminAreas({
        countries,
        adminLevel: 0 as AdminLevel,
        skip: isDefined(urlMapView) || countriesPending,
    });

    const countryMapView = useMemo(
        () => {
            const countryBounds = isDefined(adminAreas)
                ? getFeatureCollectionBounds(adminAreas)
                : undefined;

            return isDefined(countryBounds)
                ? { ...defaultMapView, fitBounds: countryBounds }
                : undefined;
        },
        [adminAreas],
    );

    // MapView preference: URL > countries > default.
    return urlMapView ?? countryMapView ?? defaultMapView;
}

export default useNrwMapView;
