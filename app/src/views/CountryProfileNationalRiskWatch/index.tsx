import {
    Container,
    ListView,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { isDefined } from '@togglecorp/fujs';

import NrwEvents from '#components/domain/NrwEvents';
import NrwMap from '#components/domain/NrwMap';
import NrwNavbar from '#components/domain/NrwNavbar';
import Page from '#components/Page';
import { nrwStandalone } from '#config';

import useNrwAdminAreas from './hooks/useNrwAdminAreas';
import useNrwEvents from './hooks/useNrwEvents';
import useNrwLayers from './hooks/useNrwLayers';
import useNrwSearchParams from './hooks/useNrwSearchParams';
import NrwLngLat from './NrwLngLat';
import {
    type AdminLevel,
    type Latitude,
    type Longitude,
    type MapView,
    type Zoom,
} from './types';
import {
    getEventCountries,
    getFeatureCollectionBounds,
    getMapView,
} from './utils';

import i18n from './i18n.json';
import styles from './styles.module.css';

const defaultZoom = 3 as Zoom;
const defaultLatitude = 0 as Latitude;
const defaultLongitude = 0 as Longitude;

const defaultMapView: MapView = {
    center: new NrwLngLat(defaultLongitude, defaultLatitude),
    zoom: defaultZoom,
};

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const strings = useTranslation(i18n);

    // Child components should not have to know about URLs.
    const {
        zoomFromUrlParams,
        latitudeFromUrlParams,
        longitudeFromUrlParams,
        urlCountries,
        handleMapViewChange,
    } = useNrwSearchParams();

    // Set from the longitude/latitude search params when they are present.
    const urlMapView = getMapView(
        latitudeFromUrlParams,
        longitudeFromUrlParams,
        zoomFromUrlParams ?? defaultZoom,
    );

    const {
        events,
        pending: eventsPending,
        error: eventsError,
    } = useNrwEvents(urlCountries);

    const eventCountries = getEventCountries(events ?? []);
    const countries = urlCountries?.length ? urlCountries : eventCountries;

    // Load the available layers once countries are resolved.
    // Once selected events are added, pass the selected event as an arg.
    useNrwLayers(countries.length > 0);

    const {
        adminAreas,
    } = useNrwAdminAreas({
        countries,
        adminLevels: [0 as AdminLevel],
        skip: isDefined(urlMapView),
    });

    const countryBounds = isDefined(adminAreas)
        ? getFeatureCollectionBounds(adminAreas)
        : undefined;

    const countryMapView = isDefined(countryBounds)
        ? { ...defaultMapView, fitBounds: countryBounds }
        : undefined;

    // MapView preference: URL > countries > default.
    const mapView = urlMapView ?? countryMapView ?? defaultMapView;

    const content = (
        <Container
            heading={nrwStandalone ? '' : strings.nationalRiskWatchHeading}
        >
            <ListView
                layout="grid"
                withSidebar
                sidebarSize="lg"
                gridContentClassName={styles.eventsHeight}
            >
                <NrwMap
                    mapView={mapView}
                    onMapViewChange={handleMapViewChange}
                    events={events}
                />
                <NrwEvents
                    events={events}
                    pending={eventsPending}
                    errored={isDefined(eventsError)}
                />
            </ListView>
        </Container>
    );

    if (nrwStandalone) {
        return (
            <div className={styles.countryProfileNrwStandalone}>
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
