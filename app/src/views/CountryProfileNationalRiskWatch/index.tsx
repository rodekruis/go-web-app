import {
    Container,
    ListView,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { isDefined } from '@togglecorp/fujs';

import NrwEvents from '#components/domain/NrwEvents';
import NrwLegendBanner from '#components/domain/NrwLegendBanner';
import NrwMap from '#components/domain/NrwMap';
import NrwNavbar from '#components/domain/NrwNavbar';
import Page from '#components/Page';
import { nrwStandalone } from '#config';

import NrwEventsContext from './contexts/NrwEventsContext';
import useNrwEvents from './hooks/useNrwEvents';
import useNrwLayers from './hooks/useNrwLayers';
import useNrwLegend from './hooks/useNrwLegend';
import useNrwMapView from './hooks/useNrwMapView';
import useNrwSearchParams from './hooks/useNrwSearchParams';
import NrwAdminAreasProvider from './NrwAdminAreasProvider';
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
        ? undefined // NrwShapeLayer will handle the map zoom when an event is selected.
        : countries;

    const { mapView, preserveInitialView } = useNrwMapView({
        urlZoom: zoomFromUrlParams,
        urlLatitude: latitudeFromUrlParams,
        urlLongitude: longitudeFromUrlParams,
        countries: mapCountries,
        countriesPending: isDefined(selectedEventId) && eventsPending,
    });

    const {
        availableLayers,
        visibleLayers,
        handleLayerToggle,
    } = useNrwLayers({
        visibleLayers: layersFromUrlParams,
        onVisibleLayersChange: setLayersFromUrlParams,
        selectedEvent,
    });

    const { legendItems } = useNrwLegend({
        availableLayers,
        visibleLayers,
        enabled: isDefined(selectedEvent),
    });

    const mapAndLegend = (
        <div className={styles.mapAndLegend}>
            <ListView
                className={styles.mapGrid}
                layout="grid"
                withSidebar
                sidebarSize="lg"
                gridContentClassName={styles.eventsHeight}
            >
                <NrwMap
                    mapView={mapView}
                    preserveInitialView={preserveInitialView}
                    onMapViewChange={handleMapViewChange}
                    availableLayers={availableLayers}
                    visibleLayers={visibleLayers}
                    onLayerToggle={handleLayerToggle}
                    legendItems={legendItems}
                />
                <NrwEvents />
            </ListView>
            <NrwLegendBanner
                availableLayers={availableLayers}
                visibleLayers={visibleLayers}
            />
        </div>
    );

    const content = (
        <NrwEventsContext.Provider value={nrwEventsContext}>
            <NrwAdminAreasProvider event={selectedEvent}>
                {nrwStandalone ? mapAndLegend : (
                    <Container heading={strings.nationalRiskWatchHeading}>
                        {mapAndLegend}
                    </Container>
                )}
            </NrwAdminAreasProvider>
        </NrwEventsContext.Provider>
    );

    if (nrwStandalone) {
        return (
            <div className={styles.countryProfileNrwStandalone}>
                <NrwNavbar />
                <Page
                    className={styles.page}
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
