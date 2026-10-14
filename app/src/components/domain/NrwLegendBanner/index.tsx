import { useContext } from 'react';
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
    NrwLegendState,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwMarkerLegend from './NrwMarkerLegend';

import i18n from './i18n.json';
import styles from './styles.module.css';

function NrwLegendBanner(props: {
    availableLayers: NrwLayer[];
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

    switch (legend.state) {
        case NrwLegendState.NoEvent:
            return (
                <div className={styles.nrwLegendBannerContent}>
                    <NrwMarkerLegend />
                </div>
            );
        case NrwLegendState.NoLayers:
            return (
                <div className={_cs(styles.nrwLegendBannerContent, styles.message)}>
                    <FontAwesomeIcon
                        icon={faCircleInfo}
                        className={styles.messageIcon}
                    />
                    {strings.nrwLegendBannerNoLayersMessage}
                </div>
            );
        case NrwLegendState.Items:
            return (
                <div className={styles.nrwLegendBannerContent}>
                    {legend.items.map((item) => (
                        <NrwLegendItem
                            key={item.layerName}
                            item={item}
                        />
                    ))}
                </div>
            );
        default: {
            const exhaustiveCheck: never = legend;
            throw new Error(
                `NrwLegendBanner: unexpected legend state '${exhaustiveCheck}'`,
            );
        }
    }
}

export default NrwLegendBanner;
