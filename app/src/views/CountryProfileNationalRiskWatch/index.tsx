import {
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Container,
    ListView,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { isDefined } from '@togglecorp/fujs';

import NrwEvents from '#components/domain/NrwEvents';
import NrwMap from '#components/domain/NrwMap';
import NrwNavbar from '#components/domain/NrwNavbar';
import NrwPdfExport from '#components/domain/NrwPdfExport';
import Page from '#components/Page';
import { nrwStandalone } from '#config';

import NrwEventsContext from './contexts/NrwEventsContext';
import NrwScreenshotContext, {
    type NrwScreenshotContextProps,
    type NrwScreenshotHandler,
} from './contexts/NrwScreenshotContext';
import useNrwEvents from './hooks/useNrwEvents';
import useNrwLayers from './hooks/useNrwLayers';
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

    const [takeScreenshot, setTakeScreenshot] = useState<NrwScreenshotHandler>();
    // Wrap in a plain callback: a raw state setter would invoke the handler
    // argument as a state updater function.
    const registerScreenshot = useCallback((handler: NrwScreenshotHandler | undefined) => {
        setTakeScreenshot(handler ? () => handler : undefined);
    }, []);
    const nrwScreenshotContext = useMemo<NrwScreenshotContextProps>(
        () => ({ takeScreenshot }),
        [takeScreenshot],
    );
    const eventsPanelRef = useRef<HTMLDivElement>(null);

    const exportButton = countries.length > 0
        ? <NrwPdfExport eventsPanelRef={eventsPanelRef} countries={countries} />
        : undefined;

    const content = (
        <NrwAdminAreasProvider event={selectedEvent}>
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
                        preserveInitialView={preserveInitialView}
                        onMapViewChange={handleMapViewChange}
                        availableLayers={availableLayers}
                        visibleLayers={visibleLayers}
                        onLayerToggle={handleLayerToggle}
                        registerScreenshot={registerScreenshot}
                    />
                    <NrwEvents elementRef={eventsPanelRef} />
                </ListView>
            </Container>
        </NrwAdminAreasProvider>
    );

    return (
        <NrwEventsContext.Provider value={nrwEventsContext}>
            <NrwScreenshotContext.Provider value={nrwScreenshotContext}>
                {nrwStandalone ? (
                    <div className={styles.countryProfileNrwStandalone}>
                        <NrwNavbar actions={exportButton} />
                        <Page
                            title={strings.nationalRiskWatchPageTitle}
                            mainSectionContainerClassName={styles.mainSectionContainer}
                            mainSectionClassName={styles.mainSection}
                        >
                            {content}
                        </Page>
                    </div>
                ) : content}
            </NrwScreenshotContext.Provider>
        </NrwEventsContext.Provider>
    );
}

Component.displayName = 'CountryProfileNationalRiskWatch';
