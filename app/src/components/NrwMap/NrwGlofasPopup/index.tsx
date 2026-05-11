import { type GlofasStationData } from '#utils/nrw/nrwMapTypes';

import styles from './styles.module.css';

interface NrwGlofasPopupProps {
    data: GlofasStationData;
    onClose: () => void;
}

/**
 * Side panel that shows information for the currently selected event's
 * Glofas station.
 *
 * For now this is a placeholder layout that simply renders the fields from
 * `GlofasStationData`. Design is TBD.
 */
function NrwGlofasPopup(props: NrwGlofasPopupProps) {
    const { data, onClose } = props;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.title}>
                    {data.stationName}
                </div>
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>
            </div>
            <div className={styles.content}>
                <div className={styles.field}>
                    <span className={styles.label}>Location:</span>
                    {' '}
                    <span className={styles.value}>{data.locationName}</span>
                </div>
                <div className={styles.field}>
                    <span className={styles.label}>LonLat:</span>
                    {' '}
                    <span className={styles.value}>
                        {data.lonLat[0]}
                        ,
                        {' '}
                        {data.lonLat[1]}
                    </span>
                </div>
                <div className={styles.field}>
                    <span className={styles.label}>Peak time:</span>
                    {' '}
                    <span className={styles.value}>{data.peakTime}</span>
                </div>
                <div className={styles.field}>
                    <span className={styles.label}>Max discharge:</span>
                    {' '}
                    <span className={styles.value}>{data.maxDischarge}</span>
                </div>
                <div className={styles.field}>
                    <div className={styles.label}>Discharge thresholds:</div>
                    <div className={styles.value}>
                        {data.dischargeThresholds.join(', ')}
                    </div>
                </div>
                {data.triggerStatement && (
                    <div className={styles.field}>
                        <div className={styles.label}>Trigger statement:</div>
                        <div className={styles.value}>{data.triggerStatement}</div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NrwGlofasPopup;
