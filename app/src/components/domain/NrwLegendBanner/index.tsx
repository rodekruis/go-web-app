import {
    type ReactNode,
    useContext,
} from 'react';
import { faCircleInfo } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { _cs } from '@togglecorp/fujs';

import NrwLegendItem from '#components/domain/NrwLegendItem';
import NrwEventsContext from '#views/CountryProfileNationalRiskWatch/contexts/NrwEventsContext';
import useNrwLegend from '#views/CountryProfileNationalRiskWatch/hooks/useNrwLegend';
import NrwAdminAreasContext from '#views/CountryProfileNationalRiskWatch/NrwAdminAreasProvider/NrwAdminAreasContext';
import {
    type NrwLayer,
    type NrwLayerName,
    type NrwLegend,
    NrwLegendState,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwMarkerLegend from './NrwMarkerLegend';

import i18n from './i18n.json';
import styles from './styles.module.css';

function NrwLegendBanner(props: {
    availableLayers: NrwLayer[] | undefined;
    visibleLayers: NrwLayerName[];
}) {
    const { availableLayers, visibleLayers } = props;

    const strings = useTranslation(i18n);
    const { selectedEvent } = useContext(NrwEventsContext);
    const { exposedPopulationScale } = useContext(NrwAdminAreasContext);

    const legend = useNrwLegend({
        placement: 'banner',
        selectedEvent,
        exposedPopulationScale,
        availableLayers,
        visibleLayers,
    });

    let content: ReactNode;
    switch (legend.state) {
        case NrwLegendState.Items:
            content = legend.items.map((item) => (
                <NrwLegendItem
                    key={item.layerName}
                    item={item}
                />
            ));
            break;
        case NrwLegendState.NoEvent:
            content = <NrwMarkerLegend />;
            break;
        case NrwLegendState.NoLayers:
            content = (
                <>
                    <FontAwesomeIcon
                        icon={faCircleInfo}
                        className={styles.messageIcon}
                    />
                    {strings.nrwLegendBannerNoLayersMessage}
                </>
            );
            break;
        default:
            throw new Error(
                `NrwLegendBanner: unexpected legend state '${(legend as NrwLegend).state}'`,
            );
    }

    return (
        <div
            className={_cs(
                styles.nrwLegendBannerContent,
                legend.state === NrwLegendState.NoLayers && styles.message,
            )}
        >
            {content}
        </div>
    );
}

export default NrwLegendBanner;
