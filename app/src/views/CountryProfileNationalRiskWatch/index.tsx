import {
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    useParams,
    useSearchParams,
} from 'react-router-dom';
import {
    Container,
    ListView,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { isDefined } from '@togglecorp/fujs';

import NrwMap from '#components/domain/NrwMap';
import NrwNavbar from '#components/domain/NrwNavbar';
import Page from '#components/Page';
import { nrwStandalone } from '#config';
import useCountry from '#hooks/domain/useCountry';
import useUrlSearchState from '#hooks/useUrlSearchState';
import { useNrwRequest } from '#utils/restRequest';

import NrwLngLat from './NrwLngLat';
import {
    type InitialMapView,
    type Latitude,
    type Longitude,
    type MapViewChangeHandler,
    type Zoom,
} from './types';
import {
    getAdminArea0Query,
    getFeatureCollectionBounds,
    parseCountriesUrlParameter,
    parseCountryCode,
    parseMapLatitudeParameter,
    parseMapLongitudeParameter,
    parseZoomUrlParameter,
    serializeCountriesUrlParameter,
} from './utils';

import i18n from './i18n.json';
import styles from './styles.module.css';

const defaultZoom = 3 as Zoom;
const defaultLatitude = 0 as Latitude;
const defaultLongitude = 0 as Longitude;

const roundZoomForUrl = (zoom: Zoom) => zoom.toFixed(2).toString();

const roundLatitudeOrLongitudeForUrl = (value: Latitude | Longitude) => value.toFixed(6).toString();

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const strings = useTranslation(i18n);

    // Child components should not have to know about URLs.

    // useUrlSearchState is limited: it's setValue hook cannot handle setting
    // multiple params in quick succession. Workaround: use setSearchParams for
    // handling map view changing.
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
    const countriesResolved = nrwStandalone || isDefined(countryFromRouting);

    // Initial view state on map creation
    const [initialMapView, setInitialMapView] = useState<InitialMapView>();

    const hasInitialLatLon = isDefined(latitudeFromUrl) && isDefined(longitudeFromUrl);

    // The bounds are only needed when no deep-linked lat/lon is present and
    // the initial view hasn't been resolved yet.
    const shouldFetchBounds = countriesResolved
        && !initialMapView
        && countries.length > 0
        && !hasInitialLatLon;

    // Memoized so the request hook doesn't see a new query identity on every
    // render. Countries never change after load.
    const adminArea0Query = useMemo(
        () => (countries.length > 0 ? getAdminArea0Query(countries) : undefined),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [countriesResolved],
    );

    // Fit the scoped countries' bounds: fetch their admin0 outlines through
    // the shared NRW request infrastructure and compute combined bounds.
    // The hook aborts the request on unmount. On failure or empty geometries,
    // fall back to the default view.
    useNrwRequest({
        url: '/admin-areas',
        apiType: 'nrw',
        skip: !shouldFetchBounds,
        query: adminArea0Query,
        onSuccess: (featureCollection) => {
            const bounds = getFeatureCollectionBounds(featureCollection);
            setInitialMapView((current) => current ?? {
                center: new NrwLngLat(defaultLongitude, defaultLatitude),
                zoom: defaultZoom,
                fitBounds: bounds ?? undefined,
            });
        },
        onFailure: () => {
            setInitialMapView((current) => current ?? {
                center: new NrwLngLat(defaultLongitude, defaultLatitude),
                zoom: defaultZoom,
            });
        },
    });

    // Resolve the initial map view exactly once, in order of precedence:
    // 1. Country list is empty: log an error and never mount the map.
    // 2. Deep-linked lat/lon in the URL: use that for the view.
    // 3. Otherwise: the bounds request above fits the scoped countries.
    useEffect(
        () => {
            if (!countriesResolved || initialMapView) {
                return;
            }

            if (countries.length === 0) {
                // eslint-disable-next-line no-console
                console.error('No countries set for NRW. Map will not be displayed.');
                return;
            }

            if (hasInitialLatLon) {
                setInitialMapView({
                    center: new NrwLngLat(longitudeFromUrl, latitudeFromUrl),
                    zoom: zoomFromUrl ?? defaultZoom,
                });
            }
        },
        // Countries never change after load, so countriesResolved and
        // initialMapView are the only real dependencies.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [countriesResolved, initialMapView],
    );

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

    const content = (
        <Container
            heading={nrwStandalone ? '' : strings.nationalRiskWatchHeading}
        >
            <ListView
                layout="grid"
                withSidebar
            >
                {initialMapView && (
                    <NrwMap
                        initialMapView={initialMapView}
                        onMapViewChange={handleMapViewChange}
                    />
                )}
            </ListView>
        </Container>
    );

    if (nrwStandalone) {
        return (
            <div className={styles.countryProfileNrw}>
                <NrwNavbar />
                <Page
                    title={strings.nationalRiskWatchPageTitle}
                    mainSectionContainerClassName={styles.mainSectionContainer}
                    mainSectionClassName={styles.mainSection}
                >
                    {content}
                </Page>
            </div>
        );
    }

    return content;
}

Component.displayName = 'CountryProfileNationalRiskWatch';
