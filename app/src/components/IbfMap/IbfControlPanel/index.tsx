import styles from './styles.module.css';

import {
    Button,
} from '@ifrc-go/ui';

interface IbfControlPanelProps {
    onToggleImageLayer: () => void;
    isLoading: boolean;
    isLayerLoaded: boolean;
    isLayerVisible: boolean;
}

/**
 * Debug component for UI to control the map. *
 * This will change once we have a design. *
 * The available controls here will depend on the event and available data. *
 * @returns A component that is intended to be nested within a IbfMapContainer.
 */
export function IbfControlPanel({ onToggleImageLayer, isLayerLoaded, isLayerVisible }: IbfControlPanelProps) {
    let buttonText = 'Load Flood Map Layer';

    // TODO: pass the fetching function to the control panel so that the control panel can more easily
    // track the loading/loaded state.
    if (isLayerLoaded && isLayerVisible) {
        buttonText = 'Hide Flood Map Layer';
    } else if (isLayerLoaded && !isLayerVisible) {
        buttonText = 'Show Flood Map Layer';
    }

    return (
        <div className={styles.dataContainer}>
            <Button
                name={"test_button_ID"}
                onClick={onToggleImageLayer}
            >
                {buttonText}
            </Button>
        </div>
    );
}