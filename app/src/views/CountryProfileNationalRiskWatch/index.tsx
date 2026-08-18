import {
    useEffect,
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

import NrwLngLat from './NrwLngLat';
import {
    type Latitude,
    type Longitude,
    type MapViewChangeHandler,
    type Zoom,
} from './types';
import {
    DEFAULT_LATITUDE,
    DEFAULT_LONGITUDE,
    DEFAULT_MAP_ZOOM,
    fitCountriesMapView,
    type InitialMapView,
    parseCountriesUrlParameter,
    parseCountryCode,
    parseMapLatitudeParameter,
    parseMapLongitudeParameter,
    parseZoomUrlParameter,
    serializeCountriesUrlParameter,
} from './utils';

import i18n from './i18n.json';
import styles from './styles.module.css';

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

    // Resolve the initial map view exactly once, in order of precedence:
    // 1. Country list is empty: log an error and never mount the map.
    // 2. Deep-linked lat/lon in the URL: use that for the view.
    // 3. Otherwise: fit the scoped countries' bounds.
    useEffect(
        () => {
            if (!countriesResolved || initialMapView) {
                return undefined;
            }

            if (countries.length === 0) {
                // eslint-disable-next-line no-console
                console.error('No countries set for NRW. Map will not be displayed.');
                return undefined;
            }

            const hasInitialLatLon = isDefined(latitudeFromUrl) && isDefined(longitudeFromUrl);
            if (hasInitialLatLon) {
                setInitialMapView({
                    center: new NrwLngLat(longitudeFromUrl, latitudeFromUrl),
                    zoom: zoomFromUrl ?? DEFAULT_MAP_ZOOM,
                });
                return undefined;
            }

            const controller = new AbortController();

            fitCountriesMapView(countries, controller.signal).then((fitted) => {
                setInitialMapView((current) => current ?? fitted ?? {
                    center: new NrwLngLat(DEFAULT_LONGITUDE, DEFAULT_LATITUDE),
                    zoom: DEFAULT_MAP_ZOOM,
                });
            });

            return () => controller.abort();
        },
        // Countries never change after load, so countriesReady and initialMapView
        // are the only real dependencies.
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
                        zoom={initialMapView.zoom}
                        center={initialMapView.center}
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
