import {
    useParams,
    useSearchParams,
} from 'react-router-dom';
import { isDefined } from '@togglecorp/fujs';

import { nrwStandalone } from '#config';
import useCountry from '#hooks/domain/useCountry';
import useUrlSearchState from '#hooks/useUrlSearchState';

import {
    type Latitude,
    type Longitude,
    type MapViewChangeHandler,
    type Zoom,
} from '../types';
import {
    parseCountriesUrlParameter,
    parseCountryCode,
    parseMapLatitudeParameter,
    parseMapLongitudeParameter,
    parseZoomUrlParameter,
    serializeCountriesUrlParameter,
} from './utils';

const roundZoomForUrl = (zoom: Zoom) => zoom.toFixed(2).toString();

const roundLatitudeOrLongitudeForUrl = (value: Latitude | Longitude) => value.toFixed(6).toString();

// Hook for the National Risk Watch map view search params
function useNrwSearchParams() {
    // useUrlSearchState is limited: its setValue hook cannot handle setting
    // multiple params in quick succession. Workaround: use setSearchParams for
    // handling map view changes.
    const [, setSearchParams] = useSearchParams();
    // Unlikely that these URL params will have invalid values, but let's be defensive.
    const [zoomFromUrl] = useUrlSearchState('z', parseZoomUrlParameter, () => '');
    const [latitudeFromUrl] = useUrlSearchState('lat', parseMapLatitudeParameter, () => '');
    const [longitudeFromUrl] = useUrlSearchState('lon', parseMapLongitudeParameter, () => '');
    const [countriesFromUrl] = useUrlSearchState(
        'countries',
        parseCountriesUrlParameter,
        serializeCountriesUrlParameter,
    );

    // For embedded, get the country from the route.
    // These are hooks, so they can't be placed in a conditional block.
    // For standalone, this will return undefined, which is fine.
    const { countryId } = useParams<{ countryId: string }>();
    const countryFromRouting = useCountry({ id: Number(countryId) });

    // The countries that the map is scoped to.
    // Handle both standalone and embedded modes (from search params or from routing).
    // Countries are set once at load and never change.
    const countries = nrwStandalone
        ? countriesFromUrl
        : [parseCountryCode(countryFromRouting?.iso3)].filter(isDefined);

    // The scoped countries are resolved synchronously in standalone mode (from
    // the URL) but asynchronously in embedded mode (from the routed country).
    const countriesResolved = nrwStandalone || countryFromRouting !== undefined;

    const handleMapViewChange: MapViewChangeHandler = (
        newZoom,
        newLatitude,
        newLongitude,
    ) => {
        setSearchParams(
            (prevParams) => {
                prevParams.set('z', roundZoomForUrl(newZoom));
                prevParams.set('lat', roundLatitudeOrLongitudeForUrl(newLatitude));
                prevParams.set('lon', roundLatitudeOrLongitudeForUrl(newLongitude));
                return prevParams;
            },
            { replace: true },
        );
    };

    return {
        zoomFromUrl,
        latitudeFromUrl,
        longitudeFromUrl,
        countries,
        countriesResolved,
        handleMapViewChange,
    };
}

export default useNrwSearchParams;
