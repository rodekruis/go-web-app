import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import TestProviders from '#utils/testing/TestProviders';
import { type NrwStaticLayer } from '#views/CountryProfileNationalRiskWatch/types';

import NrwLayerPanel from './index';

import i18n from './i18n.json';

function createLayer(name: NrwStaticLayer['name'], label: string): NrwStaticLayer {
    return {
        id: label.length,
        name,
        label,
        type: 'raster',
        description: undefined,
        hazardType: undefined,
    };
}

const floodDepth = createLayer('floodDepth', 'Flood depth');
const populationDensity = createLayer('populationDensity', 'Population density');
const exposedPopulation = createLayer('exposedPopulation', 'Exposed population');
const clinics = createLayer('clinics', 'Clinics');
const windSpeed = createLayer('windSpeed', 'Wind speed');

function getCheckboxLabels() {
    return screen.queryAllByRole('checkbox').map((checkbox) => checkbox.textContent);
}

describe('NrwLayerPanel', () => {
    test('lists the supported layers in the panel order, not the api order', () => {
        // Act
        render(
            <NrwLayerPanel
                layers={[clinics, exposedPopulation, populationDensity, floodDepth]}
                visibleLayers={[]}
                onLayerToggle={vi.fn()}
            />,
            { wrapper: TestProviders },
        );

        // Assert
        expect(getCheckboxLabels()).toEqual([
            'Exposed population',
            'Flood depth',
            'Clinics',
            'Population density',
        ]);
    });

    test('leaves out the layers the frontend does not support', () => {
        // Act
        render(
            <NrwLayerPanel
                layers={[windSpeed, clinics]}
                visibleLayers={[]}
                onLayerToggle={vi.fn()}
            />,
            { wrapper: TestProviders },
        );

        // Assert
        expect(getCheckboxLabels()).toEqual(['Clinics']);
        expect(
            screen.queryByText(i18n.strings.nrwLayerPanelNoLayersMessage),
        ).not.toBeInTheDocument();
    });

    test('shows a checked and visible event layer', () => {
        // Act
        render(
            <NrwLayerPanel
                layers={[{
                    resourceId: '10',
                    name: 'floodDepth',
                    label: 'Flood depth',
                    type: 'raster',
                }, exposedPopulation]}
                visibleLayers={['floodDepth', 'exposedPopulation']}
                onLayerToggle={vi.fn()}
            />,
            { wrapper: TestProviders },
        );

        // Assert
        expect(screen.getByRole('checkbox', { name: 'Flood depth' })).toBeChecked();
    });

    test('shows the empty message when no supported layer is available', () => {
        // Act
        render(
            <NrwLayerPanel
                layers={[windSpeed]}
                visibleLayers={[]}
                onLayerToggle={vi.fn()}
            />,
            { wrapper: TestProviders },
        );

        // Assert
        expect(getCheckboxLabels()).toEqual([]);
        expect(screen.getByText(i18n.strings.nrwLayerPanelNoLayersMessage)).toBeInTheDocument();
    });

    test('checks exactly the visible layers', () => {
        // Act
        render(
            <NrwLayerPanel
                layers={[floodDepth, populationDensity, clinics]}
                visibleLayers={['clinics', 'floodDepth']}
                onLayerToggle={vi.fn()}
            />,
            { wrapper: TestProviders },
        );

        // Assert
        expect(screen.getByRole('checkbox', { name: 'Flood depth' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'Population density' })).not.toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'Clinics' })).toBeChecked();
    });

    test('reports the name of the clicked layer, checked or not', () => {
        // Arrange
        const onLayerToggle = vi.fn();
        render(
            <NrwLayerPanel
                layers={[floodDepth, clinics]}
                visibleLayers={['clinics']}
                onLayerToggle={onLayerToggle}
            />,
            { wrapper: TestProviders },
        );

        // Act
        fireEvent.click(screen.getByRole('checkbox', { name: 'Flood depth' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'Clinics' }));

        // Assert
        expect(onLayerToggle.mock.calls).toEqual([['floodDepth'], ['clinics']]);
    });
});
