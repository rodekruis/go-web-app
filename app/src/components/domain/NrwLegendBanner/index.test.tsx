import {
    useContext,
    useMemo,
} from 'react';
import {
    render,
    screen,
} from '@testing-library/react';
import {
    describe,
    expect,
    test,
} from 'vitest';

import rampI18n from '#components/domain/NrwLegendItem/NrwLegendRamp/i18n.json';
import {
    alertClassMapRamps,
    floodDepthMapRamp,
    type NrwExposedPopulationScale,
} from '#utils/nrw/colors';
import createNrwLayer from '#utils/testing/createNrwLayer';
import TestProviders from '#utils/testing/TestProviders';
import NrwEventsContext, { type NrwEventsContextProps } from '#views/CountryProfileNationalRiskWatch/contexts/NrwEventsContext';
import NrwAdminAreasContext, { type NrwAdminAreasContextProps } from '#views/CountryProfileNationalRiskWatch/NrwAdminAreasProvider/NrwAdminAreasContext';
import {
    type NrwEvent,
    type NrwLayer,
    type NrwLayerName,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwLegendBanner from './index';

import i18n from './i18n.json';
import markerI18n from './NrwMarkerLegend/i18n.json';

const availableLayers = [
    createNrwLayer('floodDepth', 'Flood depth'),
    createNrwLayer('exposedPopulation', 'Exposed population'),
];
const bannerLayerNames: NrwLayerName[] = ['floodDepth', 'exposedPopulation'];

const event = { eventId: 1, alertClass: 'high' } as unknown as NrwEvent;
const exposedPopulationScale: NrwExposedPopulationScale = {
    ramp: alertClassMapRamps.high,
    breaks: [200, 400, 600, 800],
    exposedPopulationByPlaceCode: new Map([['SS01', 1000], ['SS02', 250]]),
};

// The contexts fall back to their defaults for the props a test leaves out.
function Harness(props: {
    events: Partial<NrwEventsContextProps>;
    adminAreas: Partial<NrwAdminAreasContextProps>;
    availableLayers: NrwLayer[] | undefined;
    visibleLayers: NrwLayerName[];
}) {
    const {
        events,
        adminAreas,
        availableLayers: layers,
        visibleLayers,
    } = props;

    const defaultEvents = useContext(NrwEventsContext);
    const defaultAdminAreas = useContext(NrwAdminAreasContext);
    const eventsValue = useMemo(
        () => ({ ...defaultEvents, ...events }),
        [defaultEvents, events],
    );
    const adminAreasValue = useMemo(
        () => ({ ...defaultAdminAreas, ...adminAreas }),
        [defaultAdminAreas, adminAreas],
    );

    return (
        <NrwEventsContext.Provider value={eventsValue}>
            <NrwAdminAreasContext.Provider value={adminAreasValue}>
                <NrwLegendBanner
                    availableLayers={layers}
                    visibleLayers={visibleLayers}
                />
            </NrwAdminAreasContext.Provider>
        </NrwEventsContext.Provider>
    );
}

function renderBanner(props: {
    selectedEvent: NrwEvent | undefined;
    exposedPopulationScale: NrwExposedPopulationScale | undefined;
    visibleLayers?: NrwLayerName[];
}) {
    const {
        selectedEvent,
        exposedPopulationScale: scale,
        visibleLayers = bannerLayerNames,
    } = props;

    return render(
        <Harness
            events={{ selectedEvent }}
            adminAreas={{ exposedPopulationScale: scale }}
            availableLayers={availableLayers}
            visibleLayers={visibleLayers}
        />,
        { wrapper: TestProviders },
    );
}

describe('NrwLegendBanner', () => {
    test('shows the visible exposure layers of the event', () => {
        // Act
        const { container } = renderBanner({
            selectedEvent: event,
            exposedPopulationScale,
        });

        // Assert
        expect(screen.getByText('Flood depth:')).toBeInTheDocument();
        expect(screen.getByText(rampI18n.strings.nrwLegendRampLow)).toBeInTheDocument();
        expect(screen.getByText('Exposed population:')).toBeInTheDocument();
        expect(screen.getByText('<200')).toBeInTheDocument();
        expect(screen.getByText('200-400')).toBeInTheDocument();
        expect(screen.getByText('800+')).toBeInTheDocument();
        expect(container.querySelectorAll('[style*="background-color"]'))
            .toHaveLength(floodDepthMapRamp.length + 5);
    });

    test('keeps the strip, empty, for an event whose legend items are not ready', () => {
        // Act
        const { container } = renderBanner({
            selectedEvent: event,
            exposedPopulationScale: undefined,
            visibleLayers: ['exposedPopulation'],
        });

        // Assert
        expect(container.firstChild).toBeEmptyDOMElement();
    });

    test('shows the alert levels and event types of the markers', () => {
        // Act
        renderBanner({
            selectedEvent: undefined,
            exposedPopulationScale: undefined,
        });

        // Assert
        const { strings } = markerI18n;
        expect(screen.getByText(strings.nrwMarkerLegendAlertLevelLabel)).toBeInTheDocument();
        expect(screen.getByText(strings.nrwMarkerLegendAlertLow)).toBeInTheDocument();
        expect(screen.getByText(strings.nrwMarkerLegendAlertHigh)).toBeInTheDocument();
        expect(screen.getByText(strings.nrwMarkerLegendEventTypeLabel)).toBeInTheDocument();
        expect(screen.getByText(strings.nrwMarkerLegendHazardCyclone)).toBeInTheDocument();
    });

    test('asks to turn on layers', () => {
        // Act
        renderBanner({
            selectedEvent: event,
            exposedPopulationScale,
            visibleLayers: [],
        });

        // Assert
        expect(screen.getByText(i18n.strings.nrwLegendBannerNoLayersMessage)).toBeInTheDocument();
    });
});
