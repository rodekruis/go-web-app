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
    sanitizeMapLatitudeParam,
    sanitizeMapLongitudeParam,
    sanitizeZoomUrlParam,
    serializeNumberToUrlParam,
} from './utils';

import i18n from './i18n.json';
import styles from './styles.module.css';

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

    const content = (
        <Container
            heading={nrwStandalone ? '' : strings.nationalRiskWatchHeading}
        >
            <ListView
                layout="grid"
                withSidebar
            >
                <NrwMap />
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
