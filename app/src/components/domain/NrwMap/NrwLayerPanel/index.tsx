import {
    faLayerGroup,
    faSquare,
} from '@fortawesome/pro-regular-svg-icons';
import { faSquareCheck } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { isDefined } from '@togglecorp/fujs';

import { getLayerOrder } from '#utils/nrw/layers';
import {
    type LayerToggleHandler,
    type NrwLayer,
    type NrwLayerName,
} from '#views/CountryProfileNationalRiskWatch/types';

import i18n from './i18n.json';
import styles from './styles.module.css';

const layerPanelOrder = getLayerOrder({
    exposedPopulation: 0,
    floodDepth: 1,
    clinics: 2,
    populationDensity: 3,
});

function NrwLayerPanel(props: {
    layers: NrwLayer[];
    visibleLayers: NrwLayerName[];
    onLayerToggle: LayerToggleHandler;
}) {
    const { layers, visibleLayers, onLayerToggle } = props;

    const strings = useTranslation(i18n);

    const supportedLayers = layerPanelOrder
        .map((name) => layers.find((layer) => layer.name === name))
        .filter(isDefined);

    const hasLayers = supportedLayers.length > 0;

    return (
        <div className={styles.layerPanel}>
            <div className={styles.title}>
                <FontAwesomeIcon
                    icon={faLayerGroup}
                    className={styles.titleIcon}
                />
                {strings.nrwLayerPanelTitle}
            </div>
            <div className={styles.items}>
                {!hasLayers && strings.nrwLayerPanelNoLayersMessage}
                {supportedLayers.map((layer) => {
                    const isVisible = visibleLayers.includes(layer.name);

                    return (
                        <button
                            key={layer.name}
                            type="button"
                            className={styles.layerToggle}
                            role="checkbox"
                            aria-checked={isVisible}
                            onClick={() => onLayerToggle(layer.name)}
                        >
                            <FontAwesomeIcon
                                icon={isVisible ? faSquareCheck : faSquare}
                                className={styles.checkbox}
                            />
                            {layer.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default NrwLayerPanel;
