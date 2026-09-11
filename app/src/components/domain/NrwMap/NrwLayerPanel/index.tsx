import {
    faLayerGroup,
    faSquare,
} from '@fortawesome/pro-regular-svg-icons';
import { faSquareCheck } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { type NrwLayer } from '#views/CountryProfileNationalRiskWatch/types';

import styles from './styles.module.css';

function NrwLayerPanel(props: {
    layers: NrwLayer[] | undefined;
    isLayerVisible: (name: NrwLayer['name']) => boolean;
    onToggleLayer: (name: NrwLayer['name']) => void;
}) {
    const { layers, isLayerVisible, onToggleLayer } = props;

    const hasLayers = (layers?.length ?? 0) > 0;

    return (
        <div className={styles.layerPanel}>
            <div className={styles.title}>
                <FontAwesomeIcon
                    icon={faLayerGroup}
                    className={styles.titleIcon}
                />
                Layers
            </div>
            <div className={styles.items}>
                {!hasLayers && 'No layers available'}
                {layers?.map((layer) => {
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
