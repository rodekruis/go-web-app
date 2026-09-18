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

import NrwEventsContext from './contexts/NrwEventsContext';
import NrwLayersContext from './contexts/NrwLayersContext';
import useNrwEvents from './hooks/useNrwEvents';
import useNrwLayers from './hooks/useNrwLayers';
import useNrwMapView from './hooks/useNrwMapView';
import useNrwSearchParams from './hooks/useNrwSearchParams';
import { getEventCountries } from './utils';

import i18n from './i18n.json';
import styles from './styles.module.css';

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
        selectedEventId,
        handleSelectedEventIdChange,
        layersFromUrlParams,
        setLayersFromUrlParams,
    } = useNrwSearchParams();

    const nrwEventsContext = useNrwEvents({
        countries: urlCountries,
        selectedEventId,
        onSelectedEventIdChange: handleSelectedEventIdChange,
    });
    const { events, pending: eventsPending, selectedEvent } = nrwEventsContext;

    const eventCountries = getEventCountries(events ?? []);
    const countries = urlCountries?.length ? urlCountries : eventCountries;

    const mapCountries = isDefined(selectedEvent)
        ? getEventCountries([selectedEvent])
        : countries;

    const mapView = useNrwMapView({
        urlZoom: zoomFromUrlParams,
        urlLatitude: latitudeFromUrlParams,
        urlLongitude: longitudeFromUrlParams,
        countries: mapCountries,
        countriesPending: isDefined(selectedEventId) && eventsPending,
    });

    const nrwLayersContext = useNrwLayers({
        urlLayers: layersFromUrlParams,
        onVisibleLayersChange: setLayersFromUrlParams,
    });

    const content = (
        <NrwEventsContext.Provider value={nrwEventsContext}>
            <NrwLayersContext.Provider value={nrwLayersContext}>
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
                        />
                        <NrwEvents />
                    </ListView>
                </Container>
            </NrwLayersContext.Provider>
        </NrwEventsContext.Provider>
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
