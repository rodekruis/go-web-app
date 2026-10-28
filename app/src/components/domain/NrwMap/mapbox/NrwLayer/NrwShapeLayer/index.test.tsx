import {
    act,
    render,
} from '@testing-library/react';
import {
    isDefined,
    noOp,
} from '@togglecorp/fujs';
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
const besidePath = createAdminAreas(
    createSquareAdminAreaFeature('SS03', 30, 5),
    createSquareAdminAreaFeature('SS04', 28, 5),
    createSquareAdminAreaFeature('SS0303', 31, 6),
    createSquareAdminAreaFeature('SS0304', 33, 6),
);

function setup(preserveInitialView: boolean) {
    const fake = createFakeMapboxMap();

    // A new element each time, so React renders it again.
    const renderLink = () => (
        <NrwMapTestHost map={fake.map} preserveInitialView={preserveInitialView}>
            <NrwAdminAreasProvider
                event={event}
                urlPlaceCode={'SS0303' as PlaceCode}
                onUrlPlaceCodeChange={noOp}
            >
                <NrwShapeLayer
                    id="layer-SSD-exposedPopulation"
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

    function fitCount() {
        return fake.calls.filter((call) => call === 'fitBounds').length;
    }

    return { answerShownLevel, answerBesidePath, fitCount };
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
});
