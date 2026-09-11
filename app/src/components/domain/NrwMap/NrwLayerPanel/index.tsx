import {
    faLayerGroup,
    faSquare,
} from '@fortawesome/pro-regular-svg-icons';
import { faSquareCheck } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from '@ifrc-go/ui/hooks';

import { type NrwLayer } from '#views/CountryProfileNationalRiskWatch/types';

import i18n from './i18n.json';
import styles from './styles.module.css';

// Layers supported in the panel, in display order.
const supportedLayerNames = [
    'population',
    'floodDepth',
] as const satisfies readonly NrwLayer['name'][];

function NrwLayerPanel(props: {
    layers: NrwLayer[] | undefined;
    isLayerVisible: (name: NrwLayer['name']) => boolean;
    onToggleLayer: (name: NrwLayer['name']) => void;
}) {
    const { layers, isLayerVisible, onToggleLayer } = props;

    const strings = useTranslation(i18n);

    const supportedLayers = supportedLayerNames
        .map((name) => layers?.find((layer) => layer.name === name))
        .filter((layer) => layer !== undefined);

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
                    const isVisible = isLayerVisible(layer.name);

                    return (
                        <button
                            key={layer.name}
                            type="button"
                            className={styles.layerToggle}
                            role="checkbox"
                            aria-checked={isVisible}
                            onClick={() => onToggleLayer(layer.name)}
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
