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

import NrwEventNotFoundBanner from '#components/domain/NrwEventNotFoundBanner';
import NrwEvents from '#components/domain/NrwEvents';
import NrwInvalidCountryError from '#components/domain/NrwInvalidCountryError';
import NrwLegendBanner from '#components/domain/NrwLegendBanner';
import NrwMap from '#components/domain/NrwMap';
import NrwNavbar from '#components/domain/NrwNavbar';
import NrwNoticeBanner from '#components/domain/NrwNoticeBanner';
import NrwPdfExport from '#components/domain/NrwPdfExport';
import Page from '#components/Page';
import {
    appTitle,
    nrwStandalone,
} from '#config';

import NrwEventsContext from './contexts/NrwEventsContext';
import NrwScreenCaptureContext, {
    type NrwScreenCaptureContextProps,
    type NrwScreenCaptureHandler,
} from './contexts/NrwScreenCaptureContext';
import useNrwEvents from './hooks/useNrwEvents';
import useNrwLayers from './hooks/useNrwLayers';
import useNrwMapView from './hooks/useNrwMapView';
import useNrwSearchParams from './hooks/useNrwSearchParams';
import useNrwSupportedCountries from './hooks/useNrwSupportedCountries';
import NrwAdminAreasProvider from './NrwAdminAreasProvider';
import {
    getEventCountries,
    getUnsupportedCountryErrors,
} from './utils';

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
        rawCountriesFromUrlParams,
        handleMapViewChange,
        selectedEventId,
        handleSelectedEventIdChange,
        layersFromUrlParams,
        setLayersFromUrlParams,
        placeCodeFromUrlParams,
        handleUrlPlaceCodeChange,
    } = useNrwSearchParams();

    const nrwEventsContext = useNrwEvents({
        // urlCountries _can_ contain invalid countries but we ignore that
        // possibility because it introduces complexity.
        countries: urlCountries,
        selectedEventId,
        onSelectedEventIdChange: handleSelectedEventIdChange,
    });
    const {
        events,
        pending: eventsPending,
        selectedEvent,
        eventNotFound,
    } = nrwEventsContext;

    const eventCountries = getEventCountries(events ?? []);
    const countries = urlCountries?.length ? urlCountries : eventCountries;

    const { supportedCountries } = useNrwSupportedCountries();

    const {
        showUnsupportedCountriesNotice,
        showUnsupportedCountriesFullpageError,
    } = getUnsupportedCountryErrors({
        standalone: nrwStandalone,
        supportedCountries,
        urlCountries,
        rawCountriesFromUrlParams,
    });

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

    // The actual screen capture function is down in the component tree and
    // specific to the mapping library. It will be available after the map has
    // loaded.
    // We pass down registerScreenCapture which registers the mapping library
    // specific code with NrwScreenCaptureContext. That context is then used by
    // the PDF export button.
    const [takeScreenCapture, setTakeScreenCapture] = useState<NrwScreenCaptureHandler>();
    // Wrap in a plain callback: a raw state setter would invoke the handler
    // argument as a state updater function.
    const registerScreenCapture = useCallback((handler: NrwScreenCaptureHandler | undefined) => {
        setTakeScreenCapture(handler ? () => handler : undefined);
    }, []);
    const nrwScreenCaptureContext = useMemo<NrwScreenCaptureContextProps>(
        () => ({ takeScreenCapture }),
        [takeScreenCapture],
    );
    const eventsPanelRef = useRef<HTMLDivElement>(null);
    const legendBannerRef = useRef<HTMLDivElement>(null);

    const exportButton = countries.length > 0
        ? (
            <NrwPdfExport
                eventsPanelRef={eventsPanelRef}
                legendBannerRef={legendBannerRef}
                countries={countries}
            />
        )
        : undefined;

    const content = showUnsupportedCountriesFullpageError ? (
        <NrwInvalidCountryError />
    ) : (
        <NrwAdminAreasProvider
            event={selectedEvent}
            urlPlaceCode={placeCodeFromUrlParams}
            onUrlPlaceCodeChange={handleUrlPlaceCodeChange}
        >
            {!nrwStandalone && eventNotFound && (
                <NrwEventNotFoundBanner key={selectedEventId} />
            )}
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
                        registerScreenCapture={registerScreenCapture}
                    />
                    <NrwEvents elementRef={eventsPanelRef} />
                </ListView>
                <NrwLegendBanner
                    availableLayers={availableLayers}
                    visibleLayers={visibleLayers}
                    elementRef={legendBannerRef}
                />
            </div>
        </NrwAdminAreasProvider>
    );

    return (
        <NrwEventsContext.Provider value={nrwEventsContext}>
            <NrwScreenCaptureContext.Provider value={nrwScreenCaptureContext}>
                {nrwStandalone ? (
                    <div className={styles.countryProfileNrwStandalone}>
                        <NrwNavbar actions={exportButton}>
                            {showUnsupportedCountriesNotice && (
                                <NrwNoticeBanner
                                    key={rawCountriesFromUrlParams.join(',')}
                                    message={strings.nrwUnsupportedCountriesMessage}
                                />
                            )}
                            {eventNotFound && (
                                <NrwEventNotFoundBanner key={selectedEventId} />
                            )}
                        </NrwNavbar>
                        <Page
                            className={styles.page}
                            title={appTitle}
                            mainSectionContainerClassName={styles.mainSectionContainer}
                            mainSectionClassName={styles.mainSection}
                        >
                            {content}
                        </Page>
                    </div>
                ) : (
                    <Container heading={strings.nationalRiskWatchHeading}>
                        {content}
                    </Container>
                )}
            </NrwScreenCaptureContext.Provider>
        </NrwEventsContext.Provider>
    );
}

Component.displayName = 'CountryProfileNationalRiskWatch';
