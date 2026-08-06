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

import {
    type Latitude,
    type Longitude,
    type Zoom,
} from './types';
import {
    NrwMapCenter,
    NrwMapZoom,
    sanitizeMapLatitudeParam,
    sanitizeMapLongitudeParam,
    sanitizeZoomUrlParam,
} from './utils';

import i18n from './i18n.json';
import styles from './styles.module.css';

const DEFAULT_MAP_ZOOM = 3 as Zoom;
const DEFAULT_LATITUDE = 0 as Latitude;
const DEFAULT_LONGITUDE = 0 as Longitude;

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const strings = useTranslation(i18n);

    // Child components should not have to know about URLs.

    // useUrlSearchState is limited: it's setValue hook cannot handle setting
    // multiple params in quick succession. Workaround: use setSearchParams for
    // handling map view changing.
    const [, setSearchParams] = useSearchParams();
    const [zoomFromUrl] = useUrlSearchState('z', sanitizeZoomUrlParam, () => '');
    const [latitudeFromUrl] = useUrlSearchState('lat', sanitizeMapLatitudeParam, () => '');
    const [longitudeFromUrl] = useUrlSearchState('lon', sanitizeMapLongitudeParam, () => '');

    const zoom = new NrwMapZoom(zoomFromUrl ?? DEFAULT_MAP_ZOOM);
    const center = new NrwMapCenter({
        latitude: latitudeFromUrl,
        longitude: longitudeFromUrl,
        defaultLat: DEFAULT_LATITUDE,
        defaultLon: DEFAULT_LONGITUDE,
    });

    const handleMapViewChange = (
        newZoom: NrwMapZoom,
        newCenter: NrwMapCenter,
    ) => {
        setSearchParams(
            (prevParams) => {
                prevParams.set('z', newZoom.getRoundedForUrl());
                prevParams.set('lat', newCenter.getLatitudeRoundedForUrl());
                prevParams.set('lon', newCenter.getLongitudeRoundedForUrl());
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
