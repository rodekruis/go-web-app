import { useSearchParams } from 'react-router-dom';
import {
    Container,
    ListView,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';

import NrwMap from '#components/domain/NrwMap';
import NrwNavbar from '#components/domain/NrwNavbar';
import Page from '#components/Page';
import { nrwStandalone } from '#config';
import useUrlSearchState from '#hooks/useUrlSearchState';

import NrwLngLat from './NrwLngLat';
import {
    type Latitude,
    type Longitude,
    type MapViewChangeHandler,
    type Zoom,
} from './types';
import {
    parseMapLatitudeParameter,
    parseMapLongitudeParameter,
    parseZoomUrlParameter,
} from './utils';

import i18n from './i18n.json';
import styles from './styles.module.css';

const DEFAULT_MAP_ZOOM = 3 as Zoom;
const DEFAULT_LATITUDE = 0 as Latitude;
const DEFAULT_LONGITUDE = 0 as Longitude;

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

    const zoom = zoomFromUrl ?? DEFAULT_MAP_ZOOM;
    // Unlikely edge case: only lng or lat is provided, not handling that.
    const center = new NrwLngLat(
        longitudeFromUrl ?? DEFAULT_LONGITUDE,
        latitudeFromUrl ?? DEFAULT_LATITUDE,
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
                <NrwMap
                    zoom={zoom}
                    center={center}
                    onMapViewChange={handleMapViewChange}
                />
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
