import {
    act,
    render,
    screen,
} from '@testing-library/react';
import { isDefined } from '@togglecorp/fujs';
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
import {
    type NrwAdminAreaFeatureCollection,
    type PlaceCode,
} from '#views/CountryProfileNationalRiskWatch/types';

import useAdminAreaHover from './useAdminAreaHover';

const adminAreaLayerIds = [adminAreaLayerId];

// One square admin area around (31, 7), as returned by /admin-areas.
const adminAreas = {
    type: 'FeatureCollection',
    features: [{
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [[[30, 6], [32, 6], [32, 8], [30, 8], [30, 6]]] },
        properties: createAdminAreaProperties('SSD.1', 1),
    }],
} as unknown as NrwAdminAreaFeatureCollection;

function HoverLayer(props: {
    layerIds: string[];
    isEnabled: boolean;
    hoveredPlaceCode: PlaceCode | undefined;
    canDrillDown: (placeCode: PlaceCode) => boolean;
    onHoverChange: (placeCode: PlaceCode | undefined) => void;
}) {
    const {
        layerIds,
        isEnabled,
        hoveredPlaceCode,
        canDrillDown,
        onHoverChange,
    } = props;

    const { hoveredAdminArea } = useAdminAreaHover(
        layerIds,
        isEnabled,
        adminAreas,
        hoveredPlaceCode,
        onHoverChange,
        canDrillDown,
    );

    if (!isDefined(hoveredAdminArea)) {
        return null;
    }

    return (
        <div role="tooltip">
            {`${hoveredAdminArea.name} at ${hoveredAdminArea.coordinates.lng}, ${hoveredAdminArea.coordinates.lat} (${hoveredAdminArea.anchor})`}
        </div>
    );
}

function setup(options: {
    layerIds?: string[];
    layersOnMap?: string[];
    isEnabled?: boolean;
    hoveredPlaceCode?: PlaceCode;
    canDrillDown: (placeCode: PlaceCode) => boolean;
}) {
    const {
        layerIds = adminAreaLayerIds,
        layersOnMap = [],
        isEnabled = true,
        hoveredPlaceCode,
        canDrillDown,
    } = options;

    const fake = createFakeMapboxMap();
    layersOnMap.forEach((layerId) => addAdminAreaLayer(fake, layerId));
    const onHoverChange = vi.fn();
    const { rerender, unmount } = render(
        <NrwMapTestHost map={fake.map}>
            <HoverLayer
                layerIds={layerIds}
                isEnabled={isEnabled}
                hoveredPlaceCode={hoveredPlaceCode}
                canDrillDown={canDrillDown}
                onHoverChange={onHoverChange}
            />
        </NrwMapTestHost>,
    );

    function hoverOver(properties: unknown, layerId = adminAreaLayerId) {
        act(() => {
            fake.simulateEvent('mousemove', {
                features: [createAdminAreaFeature(properties)],
                lngLat: { lng: 31.3, lat: 6.8 },
            }, layerId);
        });
    }

    function rerenderHoverLayer(newCanDrillDown: (placeCode: PlaceCode) => boolean) {
        rerender(
            <NrwMapTestHost map={fake.map}>
                <HoverLayer
                    layerIds={layerIds}
                    isEnabled={isEnabled}
                    hoveredPlaceCode={hoveredPlaceCode}
                    canDrillDown={newCanDrillDown}
                    onHoverChange={onHoverChange}
                />
            </NrwMapTestHost>,
        );
    }

    return {
        fake,
        onHoverChange,
        hoverOver,
        rerenderHoverLayer,
        unmount,
    };
}

describe('useAdminAreaHover', () => {
    test('reports the hover over any of the layers', () => {
        // Arrange
        const { onHoverChange, hoverOver } = setup({
            layerIds: [adminAreaLayerId, unselectedAdminAreaLayerId],
            canDrillDown: () => true,
        });

        // Act
        hoverOver(createAdminAreaProperties('SSD.2', 1), unselectedAdminAreaLayerId);

        // Assert
        expect(onHoverChange).toHaveBeenCalledWith('SSD.2');
    });

    test('highlights the hovered admin area in the source of each layer on the map', () => {
        // Arrange & Act
        const { fake, unmount } = setup({
            layerIds: [adminAreaLayerId, unselectedAdminAreaLayerId],
            layersOnMap: [adminAreaLayerId, unselectedAdminAreaLayerId],
            hoveredPlaceCode: 'SSD.1' as PlaceCode,
            canDrillDown: () => true,
        });

        // Assert
        expect(fake.getFeatureState(adminAreaLayerId, 'SSD.1')).toEqual({ hover: true });
        expect(fake.getFeatureState(unselectedAdminAreaLayerId, 'SSD.1')).toEqual({ hover: true });

        // Act
        unmount();

        // Assert
        expect(fake.getFeatureState(adminAreaLayerId, 'SSD.1')).toBeUndefined();
        expect(fake.getFeatureState(unselectedAdminAreaLayerId, 'SSD.1')).toBeUndefined();
    });
    test('shows the pointer cursor over an admin area that can be drilled into', () => {
        // Arrange
        const { fake, hoverOver } = setup({ canDrillDown: () => true });

        // Act
        hoverOver(createAdminAreaProperties('SSD.1', 1));

        // Assert
        expect(fake.canvas.style.cursor).toBe('pointer');
    });

    test('keeps the default cursor over an admin area that cannot be drilled into', () => {
        // Arrange
        const { fake, hoverOver } = setup({ canDrillDown: () => false });

        // Act
        hoverOver(createAdminAreaProperties('SSD.1.1', 2));

        // Assert
        expect(fake.canvas.style.cursor).toBe('');
    });

    test('still reports the hover for an admin area that cannot be drilled into', () => {
        // Arrange
        const { onHoverChange, hoverOver } = setup({ canDrillDown: () => false });

        // Act
        hoverOver(createAdminAreaProperties('SSD.1.1', 2));

        // Assert
        expect(onHoverChange).toHaveBeenCalledWith('SSD.1.1');
    });

    test('resets the cursor and the hover when the pointer leaves the layer', () => {
        // Arrange
        const { fake, onHoverChange, hoverOver } = setup({ canDrillDown: () => true });
        hoverOver(createAdminAreaProperties('SSD.1', 1));

        // Act
        fake.simulateEvent('mouseleave', {}, adminAreaLayerId);

        // Assert
        expect(fake.canvas.style.cursor).toBe('');
        expect(onHoverChange).toHaveBeenLastCalledWith(undefined);
    });

    test('does not register listeners when disabled', () => {
        // Arrange
        const { fake, onHoverChange, hoverOver } = setup({
            isEnabled: false,
            canDrillDown: () => true,
        });

        // Act
        hoverOver(createAdminAreaProperties('SSD.1', 1));

        // Assert
        expect(fake.canvas.style.cursor).toBe('');
        expect(onHoverChange).not.toHaveBeenCalled();
    });

    test('reads the latest canDrillDown without re-registering the listener', () => {
        // Arrange
        const { fake, hoverOver, rerenderHoverLayer } = setup({ canDrillDown: () => true });
        const properties = createAdminAreaProperties('SSD.1.1', 2);

        // Act
        hoverOver(properties);

        // Assert
        expect(fake.canvas.style.cursor).toBe('pointer');

        // Act: a new canDrillDown identity with the area no longer drillable.
        rerenderHoverLayer(() => false);
        hoverOver(properties);

        // Assert
        expect(fake.canvas.style.cursor).toBe('');
    });

    test('anchors the tooltip on the area when its row is hovered outside the map', () => {
        // Arrange & Act
        setup({ hoveredPlaceCode: 'SSD.1' as PlaceCode, canDrillDown: () => true });

        // Assert
        expect(screen.getByRole('tooltip')).toHaveTextContent('Name of SSD.1 at 31, 7 (area)');
    });

    test('follows the pointer instead while it is over the map', () => {
        // Arrange
        const { hoverOver } = setup({ hoveredPlaceCode: 'SSD.1' as PlaceCode, canDrillDown: () => true });

        // Act
        hoverOver(createAdminAreaProperties('SSD.1', 1));

        // Assert
        expect(screen.getByRole('tooltip')).toHaveTextContent('Name of SSD.1 at 31.3, 6.8 (pointer)');
    });

    test('shows no tooltip for a hovered place code that is not on the map', () => {
        // Arrange & Act
        setup({ hoveredPlaceCode: 'SSD.9' as PlaceCode, canDrillDown: () => true });

        // Assert
        expect(screen.queryByRole('tooltip')).toBeNull();
    });
});
