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
    type NrwExposedPopulationScale,
} from '#utils/nrw/colors';
import createNrwLayer from '#utils/testing/createNrwLayer';
import TestProviders from '#utils/testing/TestProviders';
import NrwEventsContext, { type NrwEventsContextProps } from '#views/CountryProfileNationalRiskWatch/contexts/NrwEventsContext';
import NrwAdminAreasContext, { type NrwAdminAreasContextProps } from '#views/CountryProfileNationalRiskWatch/NrwAdminAreasProvider/NrwAdminAreasContext';
import {
    type NrwEvent,
    type NrwLayerName,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwLegendBanner from './index';

import i18n from './i18n.json';
import markerI18n from './NrwMarkerLegend/i18n.json';

const availableLayers = [
    createNrwLayer('floodDepth', 'Flood depth'),
    createNrwLayer('exposedPopulation', 'Exposed population'),
];

const event = { eventId: 1, alertClass: 'high' } as unknown as NrwEvent;
const exposedPopulationScale: NrwExposedPopulationScale = {
    ramp: alertClassMapRamps.high,
    breaks: [200, 400, 600, 800],
    exposedPopulationByPlaceCode: new Map(),
};

// The contexts fall back to their defaults for the props a test leaves out.
function Harness(props: {
    events?: Partial<NrwEventsContextProps>;
    adminAreas?: Partial<NrwAdminAreasContextProps>;
    visibleLayers?: NrwLayerName[];
}) {
    const { events, adminAreas, visibleLayers = [] } = props;

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
                    availableLayers={availableLayers}
                    visibleLayers={visibleLayers}
                />
            </NrwAdminAreasContext.Provider>
        </NrwEventsContext.Provider>
    );
}

function renderBanner(props: {
    events?: Partial<NrwEventsContextProps>;
    adminAreas?: Partial<NrwAdminAreasContextProps>;
    visibleLayers?: NrwLayerName[];
}) {
    const { events, adminAreas, visibleLayers } = props;

    return render(
        <Harness
            events={events}
            adminAreas={adminAreas}
            visibleLayers={visibleLayers}
        />,
        { wrapper: TestProviders },
    );
}

describe('NrwLegendBanner', () => {
    test('shows the visible exposure layers of the event', () => {
        // Act
        renderBanner({
            events: { selectedEvent: event },
            adminAreas: { exposedPopulationScale },
            visibleLayers: ['floodDepth', 'exposedPopulation'],
        });

        // Assert
        screen.getByText('Flood depth:');
        screen.getByText(rampI18n.strings.nrwLegendRampLow);
        screen.getByText('Exposed population:');
        screen.getByText('<200');
        screen.getByText('200-400');
        screen.getByText('800+');
    });

    test('keeps the strip, empty, for an event whose legend items are not ready', () => {
        // Act
        const { container } = renderBanner({
            events: { selectedEvent: event },
            visibleLayers: ['exposedPopulation'],
        });

        // Assert
        expect(container.firstChild).toBeEmptyDOMElement();
    });

    test('shows the alert levels and event types of the markers', () => {
        // Act
        renderBanner({});

        // Assert
        const { strings } = markerI18n;
        screen.getByText(strings.nrwMarkerLegendAlertLevelLabel);
        screen.getByText(strings.nrwMarkerLegendAlertLow);
        screen.getByText(strings.nrwMarkerLegendAlertHigh);
        screen.getByText(strings.nrwMarkerLegendEventTypeLabel);
        screen.getByText(strings.nrwMarkerLegendHazardCyclone);
    });

    test('asks to turn on layers', () => {
        // Act
        renderBanner({ events: { selectedEvent: event } });

        // Assert
        screen.getByText(i18n.strings.nrwLegendBannerNoLayersMessage);
    });
});
