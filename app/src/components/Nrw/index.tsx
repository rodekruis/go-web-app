import MapboxDataMap from './MapboxDataMap';

import styles from './styles.module.css';

/**
 * Parent component for NRW
 * This creates the NRW components and facilitates their interactions.
 * @returns A standalone component
 */
export default function NrwMapContainer() {
    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <div className={styles.eventPanelColumn}>
                    <div />
                </div>
                <div className={styles.mapColumn}>
                    <MapboxDataMap />
                </div>
            </div>
        </div>
    );
}
