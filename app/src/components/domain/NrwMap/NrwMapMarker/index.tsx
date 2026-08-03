// To use this:
// To use it on the map, you'd render it into a DOM element via createRoot
// and pass it to new mapboxgl.Marker({ element, anchor: 'bottom' }).
// The icon and color are hard coded here to keep the changes just in these two files.
// Move the icon and color logic when the actual PR is made.

import { faHouseFloodWater } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from './styles.module.css';

interface NrwMapMarkerProps {
    onClick?: () => void;
}

export default function NrwMapMarker(props: NrwMapMarkerProps) {
    const { onClick } = props;

    return (
        <button
            className={styles.marker}
            type="button"
            onClick={onClick}
        >
            <svg
                className={styles.balloon}
                xmlns="http://www.w3.org/2000/svg"
                width="56"
                height="64"
                viewBox="0 0 56 64"
                fill="none"
            >
                <defs>
                    <filter
                        id="nrw-marker-shadow"
                        x="0"
                        y="0"
                        width="56"
                        height="64"
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                    >
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                        />
                        <feOffset dy="4" />
                        <feGaussianBlur stdDeviation="7" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
                        />
                        <feBlend
                            mode="normal"
                            in2="BackgroundImageFix"
                            result="effect1_dropShadow"
                        />
                        <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect1_dropShadow"
                            result="shape"
                        />
                    </filter>
                </defs>
                <g filter="url(#nrw-marker-shadow)">
                    <path
                        d="M28 12C21.375 12 16 17.2443 16 23.7188C16 31.1317 23.5125 40.0171 26.65 43.4035C27.3875 44.1988 28.6125 44.1988 29.35 43.4035C32.4875 40.0171 40 31.1317 40 23.7188C40 17.2443 34.625 12 28 12Z"
                        fill="var(--balloon-color)"
                        shapeRendering="crispEdges"
                    />
                    <path
                        d="M28 11C35.1545 11 41 16.6695 41 23.7188C41 27.72 38.9909 31.9963 36.6953 35.6074C34.3798 39.2498 31.6733 42.3676 30.084 44.083H30.083C28.9498 45.3051 27.0502 45.3051 25.917 44.083H25.916C24.3267 42.3676 21.6202 39.2498 19.3047 35.6074C17.0091 31.9963 15 27.72 15 23.7188C15 16.6695 20.8455 11 28 11Z"
                        stroke="#323232"
                        strokeOpacity="0.2"
                        strokeWidth="2"
                        shapeRendering="crispEdges"
                    />
                </g>
            </svg>
            <div className={styles['icon-container']}>
                <FontAwesomeIcon
                    icon={faHouseFloodWater}
                    className={styles.icon}
                />
            </div>
        </button>
    );
}
