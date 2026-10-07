import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    type NrwLegendItem,
    NrwLegendType,
} from '#utils/nrw/legend';
import TestProviders from '#utils/testing/TestProviders';

import NrwMapLegend from './index';

import i18n from './i18n.json';

const populationDensity: NrwLegendItem = {
    type: NrwLegendType.Gradient,
    layerName: 'populationDensity',
    label: 'Population density',
    colors: ['#e0e0e0', '#a8a8a8', '#6f6f6f'],
};

function renderLegend() {
    return render(
        <NrwMapLegend items={[populationDensity]} />,
        { wrapper: TestProviders },
    );
}

describe('NrwMapLegend', () => {
    test('shows a low-to-high ramp with one swatch per colour', () => {
        const { container } = renderLegend();

        expect(screen.getByText('Population density:')).toBeInTheDocument();
        expect(screen.getByText(i18n.strings.nrwMapLegendLow)).toBeInTheDocument();
        expect(screen.getByText(i18n.strings.nrwMapLegendHigh)).toBeInTheDocument();
        expect(container.querySelectorAll('[style*="background-color"]')).toHaveLength(3);
    });

    test('collapses and expands the items from the title', () => {
        renderLegend();
        const title = screen.getByRole('button', { name: i18n.strings.nrwMapLegendTitle });

        expect(title).toHaveAttribute('aria-expanded', 'true');

        fireEvent.click(title);

        expect(title).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('Population density:')).not.toBeInTheDocument();

        fireEvent.click(title);

        expect(title).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Population density:')).toBeInTheDocument();
    });
});
