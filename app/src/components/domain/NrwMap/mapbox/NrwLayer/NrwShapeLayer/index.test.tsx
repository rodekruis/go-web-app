import {
    act,
    render,
} from '@testing-library/react';
import {
    isDefined,
    noOp,
} from '@togglecorp/fujs';
import {
    type FillLayerSpecification,
    type GeoJSONSourceSpecification,
} from 'mapbox-gl-v3';
import {
    afterEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import createFakeMapboxMap from '#utils/testing/createFakeMapboxMap';
import {
    createExposedArea,
    createSquareAdminAreaFeature,
} from '#utils/testing/nrwAdminAreaTesting';
import NrwMapTestHost from '#utils/testing/NrwMapTestHost';
import TestProviders from '#utils/testing/TestProviders';
import NrwAdminAreasProvider from '#views/CountryProfileNationalRiskWatch/NrwAdminAreasProvider';
import {
    type NrwAdminAreaFeatureCollection,
    type NrwEvent,
    type PlaceCode,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwShapeLayer from '.';

// The requests are faked: the shown level is answered by the test, and the admin
// areas beside the drill path answer with the response the test sets.
interface FakeRequest {
    url: string;
    onSuccess?: (adminAreas: NrwAdminAreaFeatureCollection) => void;
}

let shownLevelRequest: FakeRequest | undefined;
let besidePathResponse: NrwAdminAreaFeatureCollection | undefined;

vi.mock('#utils/restRequest', () => ({
    useNrwRequest: (request: FakeRequest) => {
        if (request.url !== '/admin-areas') {
            return { response: undefined, pending: false, error: undefined };
        }
        if (isDefined(request.onSuccess)) {
            shownLevelRequest = request;
            return { response: undefined, pending: false, error: undefined };
        }
        return { response: besidePathResponse, pending: false, error: undefined };
    },
}));

const event = {
    eventId: 8,
    countryCodeIso3: 'SSD',
    alertClass: 'high',
    exposedAdminAreas: {
        1: [createExposedArea('SS03'), createExposedArea('SS04')],
        2: [createExposedArea('SS0303'), createExposedArea('SS0401')],
        3: [createExposedArea('SS030301'), createExposedArea('SS030302')],
    },
} as unknown as NrwEvent;

function createAdminAreas(...features: ReturnType<typeof createSquareAdminAreaFeature>[]) {
    return { type: 'FeatureCollection', features } as unknown as NrwAdminAreaFeatureCollection;
}

// The payams of Bor South, in the county Bor South of the state Jonglei.
const borSouthPayams = createAdminAreas(
    createSquareAdminAreaFeature('SS030301', 31, 6),
    createSquareAdminAreaFeature('SS030302', 32, 6),
);
const borSouthBounds = [{ lng: 31, lat: 6 }, { lng: 33, lat: 7 }];
const payamBounds = [{ lng: 31, lat: 6 }, { lng: 32, lat: 7 }];
const besidePath = createAdminAreas(
    createSquareAdminAreaFeature('SS03', 30, 5),
    createSquareAdminAreaFeature('SS04', 28, 5),
    createSquareAdminAreaFeature('SS0303', 31, 6),
    createSquareAdminAreaFeature('SS0304', 33, 6),
);

const layerId = 'layer-SSD-exposedPopulation';
const unselectedLayerId = `${layerId}-unselected`;

function setup(preserveInitialView: boolean) {
    const fake = createFakeMapboxMap();
    let urlPlaceCode = 'SS0303' as PlaceCode;

    // A new element each time, so React renders it again.
    const renderLink = () => (
        <NrwMapTestHost map={fake.map} preserveInitialView={preserveInitialView}>
            <NrwAdminAreasProvider
                event={event}
                urlPlaceCode={urlPlaceCode}
                onUrlPlaceCodeChange={noOp}
            >
                <NrwShapeLayer
                    id={layerId}
                    isVisible
                    layerAnchorId="anchor-exposedPopulation"
                />
            </NrwAdminAreasProvider>
        </NrwMapTestHost>
    );
    const { rerender } = render(renderLink(), { wrapper: TestProviders });

    function answerShownLevel(adminAreas: NrwAdminAreaFeatureCollection) {
        act(() => {
            shownLevelRequest?.onSuccess?.(adminAreas);
        });
    }

    function answerBesidePath(adminAreas: NrwAdminAreaFeatureCollection) {
        besidePathResponse = adminAreas;
        rerender(renderLink());
    }

    // Open an admin area through the url, as a click on it does.
    function openUrl(placeCode: string) {
        urlPlaceCode = placeCode as PlaceCode;
        rerender(renderLink());
    }

    function fitCount() {
        return fake.calls.filter((call) => call === 'fitBounds').length;
    }

    function lastFitBounds() {
        return fake.fitBoundsCalls.at(-1);
    }

    // The place codes of the admin areas drawn in the layer, or undefined without the layer.
    function drawnPlaceCodes(id: string) {
        const layer = fake.getLayerSpecification(id) as
            (FillLayerSpecification & { source: GeoJSONSourceSpecification }) | undefined;
        return (layer?.source.data as GeoJSON.FeatureCollection | undefined)?.features
            .map((feature) => feature.properties?.placeCode);
    }

    return {
        answerShownLevel,
        answerBesidePath,
        openUrl,
        fitCount,
        lastFitBounds,
        drawnPlaceCodes,
    };
}

afterEach(() => {
    shownLevelRequest = undefined;
    besidePathResponse = undefined;
});

describe('NrwShapeLayer', () => {
    test('keeps the map view of a link while the admin areas load', () => {
        // Arrange
        const { answerShownLevel, answerBesidePath, fitCount } = setup(true);

        // Act
        answerShownLevel(borSouthPayams);
        answerBesidePath(besidePath);

        // Assert
        expect(fitCount()).toBe(0);
    });

    test('fits the map once to the shown admin areas without a link', () => {
        // Arrange
        const { answerShownLevel, answerBesidePath, fitCount } = setup(false);

        // Act
        answerShownLevel(borSouthPayams);
        answerBesidePath(besidePath);

        // Assert
        expect(fitCount()).toBe(1);
    });

    test('draws and fits the selected admin area alone, and its level again once cleared', () => {
        // Arrange
        const {
            answerShownLevel,
            openUrl,
            fitCount,
            lastFitBounds,
            drawnPlaceCodes,
        } = setup(false);
        answerShownLevel(borSouthPayams);
        expect(lastFitBounds()).toEqual(borSouthBounds);

        // Act
        openUrl('SS030301');

        // Assert: its sibling is drawn as unselected.
        expect(drawnPlaceCodes(layerId)).toEqual(['SS030301']);
        expect(drawnPlaceCodes(unselectedLayerId)).toEqual(['SS030302']);
        expect(fitCount()).toBe(2);
        expect(lastFitBounds()).toEqual(payamBounds);

        // Act: the Back button clears the selection.
        openUrl('SS0303');

        // Assert
        expect(drawnPlaceCodes(layerId)).toEqual(['SS030301', 'SS030302']);
        expect(drawnPlaceCodes(unselectedLayerId)).toBeUndefined();
        expect(fitCount()).toBe(3);
        expect(lastFitBounds()).toEqual(borSouthBounds);
    });

    test('keeps the map view when the admin areas beside the drill path load with a selection', () => {
        // Arrange
        const {
            answerShownLevel,
            answerBesidePath,
            openUrl,
            fitCount,
        } = setup(false);
        answerShownLevel(borSouthPayams);
        openUrl('SS030301');
        expect(fitCount()).toBe(2);

        // Act
        answerBesidePath(besidePath);

        // Assert
        expect(fitCount()).toBe(2);
    });
});
