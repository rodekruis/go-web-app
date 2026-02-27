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


export function IbfControlPanel({ onToggleImageLayer, isLoading, isLayerLoaded, isLayerVisible }: IbfControlPanelProps) {
    let buttonText = 'Load Flood Map Layer';
    if (isLoading) {
        buttonText = 'Loading...';
    } else if (isLayerLoaded && isLayerVisible) {
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