import { type ReactNode } from 'react';
import { faCircleInfo } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { _cs } from '@togglecorp/fujs';

import NrwLegendItem from '#components/domain/NrwLegendItem';
import {
    type NrwLegend,
    NrwLegendState,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwMarkerLegend from '../NrwMarkerLegend';

import i18n from './i18n.json';
import styles from './styles.module.css';

// The legend strip under the map. Always rendered, so the map keeps its height
// while an event's legend items are still loading.
function NrwLegendBannerContent(props: {
    legend: NrwLegend;
}) {
    const { legend } = props;

    const strings = useTranslation(i18n);

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
            legend satisfies never;
            content = null;
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

export default NrwLegendBannerContent;
