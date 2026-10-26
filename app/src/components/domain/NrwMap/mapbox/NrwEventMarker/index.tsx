import { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RawButton } from '@ifrc-go/ui';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';

import NrwEventMarkerIcon from '#assets/icons/nrw/event-marker.svg?react';
import NrwEventName, { type NrwEventNameEvent } from '#components/domain/NrwEvents/NrwEventName';
import useHoverChange from '#hooks/useHoverChange';
import { alertClassNames } from '#utils/nrw/colors';
import hazardIcons from '#utils/nrw/hazardIcons';
import type NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

import {
    popupFlipLeftThreshold,
    popupFlipRightThreshold,
    popupFlipTopThreshold,
} from '../../popupFlipThresholds';
import NrwMapContext from '../NrwMapContext';

import styles from './styles.module.css';

// Pick NrwEvent props used in the NrwEventMarker component
type NrwEventMarkerEvent = NrwEventNameEvent & Pick<NrwEvent, 'eventId' | 'alertClass'>;

interface Props {
    event: NrwEventMarkerEvent;
    coordinates: NrwLngLat;
    hovered: boolean;
    onHoverChange: (eventId: NrwEvent['eventId'] | undefined) => void;
    onSelect: (eventId: NrwEvent['eventId']) => void;
}

export default function NrwEventMarker(props: Props) {
    const {
        event, coordinates, hovered, onHoverChange, onSelect,
    } = props;

    const { handleMouseEnter, handleMouseLeave } = useHoverChange(event.eventId, onHoverChange);
    const { map } = useContext(NrwMapContext);

    // The popup sits above the marker by default. Flip it below when close to
    // the top edge, to the left when close to the right edge, and to the right
    // when close to the left edge.
    let flipRight = false;
    let flipLeft = false;
    let flipY = false;
    if (isDefined(map)) {
        const canvas = map.getCanvas();
        const point = map.project([coordinates.lng, coordinates.lat]);
        flipRight = point.x > canvas.clientWidth - popupFlipRightThreshold;
        flipLeft = point.x < popupFlipLeftThreshold;
        flipY = point.y < popupFlipTopThreshold;
    }

    return (
        <div
            className={_cs(
                styles.eventMarker,
                alertClassNames[event.alertClass],
                hovered && styles.hovered,
                flipRight && styles.flipRight,
                flipLeft && styles.flipLeft,
                flipY && styles.flipY,
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <RawButton className={styles.eventMarkerInner} name={event.eventId} onClick={onSelect}>
                <NrwEventMarkerIcon className={styles.eventMarkerGraphic} />
                <FontAwesomeIcon
                    icon={hazardIcons[event.hazardType]}
                    className={styles.hazardIcon}
                />
            </RawButton>
            <NrwEventName className={styles.popup} event={event} stacked />
        </div>
    );
}
