import { useContext } from 'react';

import NrwEventsContext from '#views/CountryProfileNationalRiskWatch/contexts/NrwEventsContext';
import useNrwLegend from '#views/CountryProfileNationalRiskWatch/hooks/useNrwLegend';
import NrwAdminAreasContext from '#views/CountryProfileNationalRiskWatch/NrwAdminAreasProvider/NrwAdminAreasContext';
import {
    type NrwLayer,
    type NrwLayerName,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwLegendBannerContent from './NrwLegendBannerContent';

function NrwLegendBanner(props: {
    availableLayers: NrwLayer[] | undefined;
    visibleLayers: NrwLayerName[];
}) {
    const { availableLayers, visibleLayers } = props;

    const { selectedEvent } = useContext(NrwEventsContext);
    const { exposedPopulationScale } = useContext(NrwAdminAreasContext);

    const legend = useNrwLegend({
        placement: 'banner',
        selectedEvent,
        exposedPopulationScale,
        availableLayers,
        visibleLayers,
    });

    return <NrwLegendBannerContent legend={legend} />;
}

export default NrwLegendBanner;
