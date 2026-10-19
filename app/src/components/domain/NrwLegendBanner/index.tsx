import { type RefObject } from 'react';
import { faCircleInfo } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { _cs } from '@togglecorp/fujs';

import NrwLegendItem from '#components/domain/NrwLegendItem';
import useNrwLegend from '#views/CountryProfileNationalRiskWatch/hooks/useNrwLegend';
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
    elementRef?: RefObject<HTMLDivElement | null>;
}) {
    const { availableLayers, visibleLayers, elementRef } = props;

    const strings = useTranslation(i18n);

    const legend = useNrwLegend({
        placement: 'banner',
        availableLayers,
        visibleLayers,
    });

    switch (legend.state) {
        case NrwLegendState.NoEvent:
            return (
                <div ref={elementRef} className={styles.nrwLegendBannerContent}>
                    <NrwMarkerLegend />
                </div>
            );
        case NrwLegendState.NoLayers:
            return (
                <div
                    ref={elementRef}
                    className={_cs(styles.nrwLegendBannerContent, styles.message)}
                >
                    <FontAwesomeIcon
                        icon={faCircleInfo}
                        className={styles.messageIcon}
                    />
                    {strings.nrwLegendBannerNoLayersMessage}
                </div>
            );
        case NrwLegendState.Items:
            return (
                <div ref={elementRef} className={styles.nrwLegendBannerContent}>
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
