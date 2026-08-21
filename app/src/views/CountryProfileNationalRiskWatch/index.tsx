import { useState } from 'react';
import {
    Container,
    ListView,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';

import NrwMap from '#components/domain/NrwMap';
import NrwNavbar from '#components/domain/NrwNavbar';
import Page from '#components/Page';
import { nrwStandalone } from '#config';
import { useNrwRequest } from '#utils/restRequest';

import useNrwSearchParams from './hooks/useNrwSearchParams';
import NrwLngLat from './NrwLngLat';
import {
    type InitialMapView,
    type Latitude,
    type Longitude,
    type Zoom,
} from './types';
import {
    getAdminArea0Query,
    getFeatureCollectionBounds,
} from './utils';

import i18n from './i18n.json';
import styles from './styles.module.css';

const defaultZoom = 3 as Zoom;
const defaultLatitude = 0 as Latitude;
const defaultLongitude = 0 as Longitude;

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const strings = useTranslation(i18n);

    // Child components should not have to know about URLs.
    const {
        zoomFromUrl,
        latitudeFromUrl,
        longitudeFromUrl,
        countries,
        countriesResolved,
        handleMapViewChange,
    } = useNrwSearchParams();

    const hasInitialLatLon = latitudeFromUrl !== null && longitudeFromUrl !== null;

    // Initial view state on map creation
    const [initialMapView, setInitialMapView] = useState<InitialMapView | undefined>(
        // Default to the longitude/latitude search params if they are present
        hasInitialLatLon ? {
            center: new NrwLngLat(longitudeFromUrl, latitudeFromUrl),
            zoom: zoomFromUrl ?? defaultZoom,
        } : undefined,
    );

    const shouldFetchBounds = countriesResolved
        && !initialMapView
        && countries.length > 0
        && !hasInitialLatLon;

    // Get the admin area for level 0, and fit view to that.
    useNrwRequest({
        url: '/admin-areas',
        apiType: 'nrw',
        skip: !shouldFetchBounds,
        query: getAdminArea0Query(countries),
        onSuccess: (featureCollection) => {
            let bounds: InitialMapView['fitBounds'] | undefined;
            if (!featureCollection) {
                bounds = undefined;
                // eslint-disable-next-line no-console
                console.error('Admin areas not found for countries', countries);
            } else if (featureCollection.features.length === 0) {
                bounds = undefined;
                // eslint-disable-next-line no-console
                console.error('No admin area features found for countries', countries);
            } else {
                bounds = getFeatureCollectionBounds(featureCollection);
            }

            setInitialMapView({
                center: new NrwLngLat(defaultLongitude, defaultLatitude),
                zoom: defaultZoom,
                fitBounds: bounds,
            });
        },
        onFailure: () => {
            setInitialMapView({
                center: new NrwLngLat(defaultLongitude, defaultLatitude),
                zoom: defaultZoom,
            });
        },
    });

    const content = (
        <Container
            heading={nrwStandalone ? '' : strings.nationalRiskWatchHeading}
        >
            <ListView
                layout="grid"
                withSidebar
            >
                {countries.length > 0 && initialMapView && (
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
