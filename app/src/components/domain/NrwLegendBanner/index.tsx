import { useContext } from 'react';
import { faCircleInfo } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { _cs } from '@togglecorp/fujs';

import NrwLegendItem from '#components/domain/NrwMap/NrwMapLegend/NrwLegendItem';
import hazardIcons from '#utils/nrw/hazardIcons';
import NrwEventsContext from '#views/CountryProfileNationalRiskWatch/contexts/NrwEventsContext';
import useNrwLegendBanner from '#views/CountryProfileNationalRiskWatch/hooks/useNrwLegendBanner';
import NrwAdminAreasContext from '#views/CountryProfileNationalRiskWatch/NrwAdminAreasProvider/NrwAdminAreasContext';
import {
    type NrwEvent,
    type NrwEventHazardType,
    type NrwLayer,
    type NrwLayerName,
    type NrwLegendBanner as NrwLegendBannerType,
    NrwLegendBannerState,
} from '#views/CountryProfileNationalRiskWatch/types';

import i18n from './i18n.json';
import styles from './styles.module.css';

const alertClasses: NrwEvent['alertClass'][] = ['low', 'medium', 'high'];
const alertClassStyles: Record<NrwEvent['alertClass'], string | undefined> = {
    low: styles.alertLow,
    medium: styles.alertMedium,
    high: styles.alertHigh,
};

// compoundFloods shares the floods marker, so it is not listed separately.
const hazardTypes: Exclude<NrwEventHazardType, 'compoundFloods'>[] = [
    'floods',
    'drought',
    'tropicalCyclone',
];

export function NrwLegendBannerContent(props: {
    banner: NrwLegendBannerType;
}) {
    const { banner } = props;

    const strings = useTranslation(i18n);

    const alertClassLabels: Record<NrwEvent['alertClass'], string> = {
        low: strings.nrwLegendBannerAlertLow,
        medium: strings.nrwLegendBannerAlertMedium,
        high: strings.nrwLegendBannerAlertHigh,
    };
    const hazardTypeLabels: Record<(typeof hazardTypes)[number], string> = {
        floods: strings.nrwLegendBannerHazardFloods,
        drought: strings.nrwLegendBannerHazardDrought,
        tropicalCyclone: strings.nrwLegendBannerHazardCyclone,
    };

    switch (banner.state) {
        case NrwLegendBannerState.Event:
            if (banner.items.length === 0) {
                return null;
            }
            return (
                <div className={styles.nrwLegendBanner}>
                    {banner.items.map((item) => (
                        <NrwLegendItem
                            key={item.layerName}
                            item={item}
                        />
                    ))}
                </div>
            );
        case NrwLegendBannerState.Countries:
            return (
                <div className={styles.nrwLegendBanner}>
                    <div className={styles.group}>
                        <div className={styles.label}>
                            {strings.nrwLegendBannerAlertLevelLabel}
                        </div>
                        <div className={styles.entries}>
                            {alertClasses.map((alertClass) => (
                                <div
                                    key={alertClass}
                                    className={styles.entry}
                                >
                                    <span
                                        className={_cs(
                                            styles.alertMarker,
                                            alertClassStyles[alertClass],
                                        )}
                                    />
                                    {alertClassLabels[alertClass]}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.group}>
                        <div className={styles.label}>
                            {strings.nrwLegendBannerEventTypeLabel}
                        </div>
                        <div className={styles.entries}>
                            {hazardTypes.map((hazardType) => (
                                <div
                                    key={hazardType}
                                    className={styles.entry}
                                >
                                    <span className={styles.hazardMarker}>
                                        <FontAwesomeIcon
                                            icon={hazardIcons[hazardType]}
                                            className={styles.hazardIcon}
                                        />
                                    </span>
                                    {hazardTypeLabels[hazardType]}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        case NrwLegendBannerState.NoLayers:
            return (
                <div className={_cs(styles.nrwLegendBanner, styles.message)}>
                    <FontAwesomeIcon
                        icon={faCircleInfo}
                        className={styles.messageIcon}
                    />
                    {strings.nrwLegendBannerNoLayersMessage}
                </div>
            );
        case NrwLegendBannerState.Empty:
            return null;
        default:
            banner satisfies never;
            return null;
    }
}

// The legend strip under the map, spanning the page width.
function NrwLegendBanner(props: {
    availableLayers: NrwLayer[] | undefined;
    visibleLayers: NrwLayerName[];
}) {
    const { availableLayers, visibleLayers } = props;

    const { events, selectedEvent } = useContext(NrwEventsContext);
    const { adminAreas } = useContext(NrwAdminAreasContext);

    const banner = useNrwLegendBanner({
        selectedEvent,
        events,
        adminAreas,
        availableLayers,
        visibleLayers,
    });

    return <NrwLegendBannerContent banner={banner} />;
}

export default NrwLegendBanner;
