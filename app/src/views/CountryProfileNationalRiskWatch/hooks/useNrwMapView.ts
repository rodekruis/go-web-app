import {
    useMemo,
    useState,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import NrwLngLat from '../NrwLngLat';
import {
    type AdminLevel,
    type CountryCodeIso3,
    type Latitude,
    type Longitude,
    type MapView,
    type NrwEvent,
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
    selectedEventId: NrwEvent['eventId'] | undefined;
}) {
    const {
        urlZoom,
        urlLatitude,
        urlLongitude,
        countries,
        countriesPending,
        selectedEventId,
    } = props;

    // Set from the longitude/latitude search params when they are present.
    const urlMapView = getMapView(urlLatitude, urlLongitude, urlZoom ?? defaultZoom);

    // A deep link to an event with a view is deliberate, so the fit to that
    // event's areas must not override it. Deselecting clears z/lat/lon, so
    // reselecting the same event fits again.
    const [deepLink] = useState(() => ({
        eventId: selectedEventId,
        hasView: isDefined(urlMapView),
    }));
    const preserveInitialView = deepLink.hasView
        && isDefined(deepLink.eventId)
        && selectedEventId === deepLink.eventId
        && isDefined(urlMapView);

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
    const mapView: MapView = urlMapView ?? countryMapView ?? defaultMapView;

    return { mapView, preserveInitialView };
}

export default useNrwMapView;
