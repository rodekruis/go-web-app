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

import useNrwAdminAreas from './hooks/useNrwAdminAreas';
import useNrwEvents from './hooks/useNrwEvents';
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
        countries,
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
    } = useNrwEvents(countries);

    const {
        adminAreas,
        error: adminAreasError,
    } = useNrwAdminAreas({
        countries,
        adminLevels: [0 as AdminLevel],
        skip: isDefined(urlMapView),
    });

    const countryBounds = isDefined(adminAreas)
        ? getFeatureCollectionBounds(adminAreas)
        : undefined;

    // Use undefined while admin areas are loading
    const countryMapView = isDefined(adminAreas) || isDefined(adminAreasError)
        ? { ...defaultMapView, fitBounds: countryBounds }
        : undefined;

    // MapView preference: URL > countries > default
    const mapView = urlMapView
        ?? (countries?.length === 0 ? defaultMapView : countryMapView);

    const content = (
        <Container
            heading={nrwStandalone ? '' : strings.nationalRiskWatchHeading}
        >
            <ListView
                layout="grid"
                withSidebar
                sidebarSize="lg"
                gridContentClassName={styles.eventsPanelHeight}
            >
                <div>
                    {isDefined(mapView) && (
                        <NrwMap
                            mapView={mapView}
                            onMapViewChange={handleMapViewChange}
                            events={events}
                        />
                    )}
                </div>
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
