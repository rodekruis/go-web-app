import { render } from '@testing-library/react';
import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import createFakeMapboxMap from '#utils/testing/createFakeMapboxMap';
import {
    addAdminAreaLayer,
    adminAreaLayerId,
    createAdminAreaFeature,
    createAdminAreaProperties,
    unselectedAdminAreaLayerId,
} from '#utils/testing/nrwAdminAreaTesting';
import NrwMapTestHost from '#utils/testing/NrwMapTestHost';
import { type PlaceCode } from '#views/CountryProfileNationalRiskWatch/types';

import useAdminAreaClick from './useAdminAreaClick';

const drillableProperties = createAdminAreaProperties('SSD.1', 1);
const adminAreaLayerIds = [adminAreaLayerId];

function ClickLayer(props: {
    layerIds: string[];
    isEnabled: boolean;
    canDrillDown: (placeCode: PlaceCode) => boolean;
    onClick: (adminArea: unknown) => void;
}) {
    const {
        layerIds,
        isEnabled,
        canDrillDown,
        onClick,
    } = props;

    useAdminAreaClick(layerIds, isEnabled, canDrillDown, onClick);

    return null;
}

function setup(options: {
    layerIds?: string[];
    isEnabled?: boolean;
    canDrillDown: (placeCode: PlaceCode) => boolean;
}) {
    const { layerIds = adminAreaLayerIds, isEnabled = true, canDrillDown } = options;

    const fake = createFakeMapboxMap();
    addAdminAreaLayer(fake);
    const onClick = vi.fn();
    const { rerender } = render(
        <NrwMapTestHost map={fake.map}>
            <ClickLayer
                layerIds={layerIds}
                isEnabled={isEnabled}
                canDrillDown={canDrillDown}
                onClick={onClick}
            />
        </NrwMapTestHost>,
    );

    function rerenderClickLayer(newCanDrillDown: (placeCode: PlaceCode) => boolean) {
        rerender(
            <NrwMapTestHost map={fake.map}>
                <ClickLayer
                    layerIds={layerIds}
                    isEnabled={isEnabled}
                    canDrillDown={newCanDrillDown}
                    onClick={onClick}
                />
            </NrwMapTestHost>,
        );
    }

    return { fake, onClick, rerenderClickLayer };
}

describe('useAdminAreaClick', () => {
    test('reports the topmost admin area under the pointer', () => {
        // Arrange
        const { fake, onClick } = setup({ canDrillDown: () => true });
        fake.setRenderedFeatures([
            createAdminAreaFeature(drillableProperties),
            createAdminAreaFeature(createAdminAreaProperties('SSD.2', 1)),
        ]);

        // Act
        fake.simulateEvent('click', { point: { x: 1, y: 1 } });

        // Assert
        expect(onClick).toHaveBeenCalledOnce();
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ placeCode: 'SSD.1' }));
    });

    test('queries only the layers on the map', () => {
        // Arrange
        const { fake } = setup({
            layerIds: [adminAreaLayerId, unselectedAdminAreaLayerId],
            canDrillDown: () => true,
        });
        const queryRenderedFeatures = vi.spyOn(fake.map, 'queryRenderedFeatures');

        // Act
        fake.simulateEvent('click', { point: { x: 1, y: 1 } });

        // Assert
        expect(queryRenderedFeatures).toHaveBeenCalledWith(
            { x: 1, y: 1 },
            { layers: [adminAreaLayerId] },
        );
    });

    test('ignores a click when none of the layers is on the map', () => {
        // Arrange
        const { fake, onClick } = setup({
            layerIds: [unselectedAdminAreaLayerId],
            canDrillDown: () => true,
        });
        fake.setRenderedFeatures([createAdminAreaFeature(drillableProperties)]);

        // Act
        fake.simulateEvent('click', { point: { x: 1, y: 1 } });

        // Assert
        expect(onClick).not.toHaveBeenCalled();
    });
    test('reports a click on an admin area that can be drilled into', () => {
        // Arrange
        const { fake, onClick } = setup({ canDrillDown: () => true });
        fake.setRenderedFeatures([createAdminAreaFeature(drillableProperties)]);

        // Act
        fake.simulateEvent('click', { point: { x: 1, y: 1 } });

        // Assert
        expect(onClick).toHaveBeenCalledWith({
            adminLevel: 1,
            placeCode: 'SSD.1',
            name: 'Name of SSD.1',
        });
    });

    test('ignores a click on an admin area that cannot be drilled into', () => {
        // Arrange
        const { fake, onClick } = setup({ canDrillDown: () => false });
        fake.setRenderedFeatures([createAdminAreaFeature(drillableProperties)]);

        // Act
        fake.simulateEvent('click', { point: { x: 1, y: 1 } });

        // Assert
        expect(onClick).not.toHaveBeenCalled();
    });

    test('ignores a click beside the admin areas', () => {
        // Arrange
        const { fake, onClick } = setup({ canDrillDown: () => true });
        fake.setRenderedFeatures([]);

        // Act
        fake.simulateEvent('click', { point: { x: 1, y: 1 } });

        // Assert
        expect(onClick).not.toHaveBeenCalled();
    });

    test('does not register a listener when disabled', () => {
        // Arrange
        const { fake, onClick } = setup({ isEnabled: false, canDrillDown: () => true });
        fake.setRenderedFeatures([createAdminAreaFeature(drillableProperties)]);

        // Act
        fake.simulateEvent('click', { point: { x: 1, y: 1 } });

        // Assert
        expect(onClick).not.toHaveBeenCalled();
    });

    test('reads the latest canDrillDown without re-registering the listener', () => {
        // Arrange
        const { fake, onClick, rerenderClickLayer } = setup({ canDrillDown: () => false });
        fake.setRenderedFeatures([createAdminAreaFeature(drillableProperties)]);

        // Act
        fake.simulateEvent('click', { point: { x: 1, y: 1 } });

        // Assert
        expect(onClick).not.toHaveBeenCalled();

        // Act: a new canDrillDown identity with the area now drillable.
        rerenderClickLayer(() => true);
        fake.simulateEvent('click', { point: { x: 1, y: 1 } });

        // Assert
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
