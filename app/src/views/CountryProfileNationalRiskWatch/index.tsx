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
    sanitizeMapLatitudeParam,
    sanitizeMapLongitudeParam,
    sanitizeZoomUrlParam,
    serializeNumberToUrlParam,
} from './utils';

import i18n from './i18n.json';
import styles from './styles.module.css';

const DEFAULT_MAP_ZOOM = 3 as Zoom;

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const strings = useTranslation(i18n);

    // This should be the only place where we parse, serialize and set zoom
    // from/to URL.
    const [zoomFromUrl, setUrlZoom] = useUrlSearchState(
        'z', // only place we use this
        sanitizeZoomUrlParam,
        serializeNumberToUrlParam,
    );
    const zoom = zoomFromUrl ?? DEFAULT_MAP_ZOOM;

    const [latFromUrl, setUrlLat] = useUrlSearchState(
        'lat', // only place we use this
        sanitizeMapLatitudeParam,
        serializeNumberToUrlParam,
    );

    const [lonFromUrl, setUrlLon] = useUrlSearchState(
        'lon', // only place we use this
        sanitizeMapLongitudeParam,
        serializeNumberToUrlParam,
    );

    let center;
    if (latFromUrl === null || lonFromUrl === null) {
        center = new NrwMapCenter({ lat: 0 as Latitude, lon: 0 as Longitude });
    } else {
        center = new NrwMapCenter({ lat: latFromUrl, lon: lonFromUrl });
    }

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
