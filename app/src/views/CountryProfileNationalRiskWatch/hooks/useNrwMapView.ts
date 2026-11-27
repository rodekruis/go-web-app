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
    // A link was opened, or the browser back or forward button was used.
    isHistoryNavigation: boolean;
}) {
    const {
        urlZoom,
        urlLatitude,
        urlLongitude,
        countries,
        countriesPending,
        isHistoryNavigation,
    } = props;

    // Set from the longitude/latitude search params when they are present.
    const urlMapView = getMapView(urlLatitude, urlLongitude, urlZoom ?? defaultZoom);

    // Keep the map view of a link or of a history entry, also once admin areas load.
    // After the user navigates, the map fits to the admin areas again.
    const preserveMapView = isHistoryNavigation && isDefined(urlMapView);

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
    // Only the map view of the URL is followed: the default view would move the
    // map away while the bounds of a selected event are pending.
    const mapView: MapView = isDefined(urlMapView)
        ? { ...urlMapView, followCenterAndZoom: true }
        : countryMapView ?? defaultMapView;

    return { mapView, preserveMapView };
}

export default useNrwMapView;
