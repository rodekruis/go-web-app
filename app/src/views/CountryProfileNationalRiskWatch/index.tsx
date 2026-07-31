import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    ListView,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';

import NrwMap from '#components/domain/NrwMap';
import NrwNavbar from '#components/domain/NrwNavbar';
import Page from '#components/Page';
import { nrwStandalone } from '#config';
import useCountry from '#hooks/domain/useCountry';
import useNrwMapSearchParams from '#hooks/useNrwMapSearchParams';
import type { MapViewParameters } from '#utils/nrw/nrwMapTypes';

import i18n from './i18n.json';
import styles from './styles.module.css';

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const strings = useTranslation(i18n);

    // Hook for URL search param handling
    const {
        initialParams: {
            scopedCountries: searchParamCountries,
            initialMapView,
        },
        setMapViewParams,
    } = useNrwMapSearchParams();

    // (For embedded mode) Hooks to fetch the country from the route path.
    const { countryId } = useParams<{ countryId: string }>();
    const routeCountry = useCountry({ id: Number(countryId) });

    // The countries that the map is scoped to
    const scopedCountries = useMemo(
        () => {
            // For NRW standalone mode, use the countries from the search param
            if (nrwStandalone) {
                return searchParamCountries;
            }
            // For NRW embedded mode, use the country from the route path
            return routeCountry?.iso3 ? [routeCountry.iso3] : [];
        },
        [searchParamCountries, routeCountry],
    );

    // Update the url params as the viewstate changes
    const handleMapViewChanged = (mapView: MapViewParameters) => {
        setMapViewParams({
            countries: nrwStandalone ? scopedCountries : [],
            mapView,
        });
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
                    scopedCountries={scopedCountries}
                    initialMapView={initialMapView}
                    onViewChange={handleMapViewChanged}
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
