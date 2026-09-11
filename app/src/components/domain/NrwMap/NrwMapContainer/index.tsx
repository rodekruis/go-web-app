import 'mapbox-gl-v3/dist/mapbox-gl.css';

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    faLayerGroup,
    faMinus,
    faPlus,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isNotDefined } from '@togglecorp/fujs';
import mapboxgl, { type Map as MapboxMap } from 'mapbox-gl-v3';

import { mbtoken } from '#config';
import {
    type Latitude,
    type Longitude,
    type MapView,
    type MapViewChangeHandler,
    type Zoom,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwMapContext from '../NrwMapContext';

import styles from './styles.module.css';

// This component wraps Mapbox so the rest of the components don't need to know
// about Mapbox.
// This component does not know about URLs or network requests.

// Get this from Mapbox Studio > Styles > Style url
const nrwMapboxStyleUrl = 'mapbox://styles/510global/cmrls7huy001501sde6mdhzlk';
const paddingPixels = 20;

function NrwMapContainer(props: {
    mapView: MapView;
    onMapViewChange: MapViewChangeHandler;
    layerPanel?: React.ReactNode;
    children?: React.ReactNode;
}) {
    const {
        mapView, onMapViewChange, layerPanel, children,
    } = props;

    const { zoom, center, fitBounds } = mapView;

    const [southWest, northEast] = fitBounds ?? [];

    const containerRef = useRef<HTMLDivElement>(null);
    const [mapboxMap, setMapboxMap] = useState<MapboxMap | undefined>(undefined);
    const [mapLoadComplete, setMapLoadComplete] = useState(false);
    const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
    const [zoomLimits, setZoomLimits] = useState({ atMin: false, atMax: false });

    const onMapViewChangeRef = useRef(onMapViewChange);
    useEffect(() => {
        onMapViewChangeRef.current = onMapViewChange;
    }, [onMapViewChange]);

    // Initialize the Mapbox map instance
    useEffect(() => {
        if (!containerRef.current) {
            return undefined;
        }

        mapboxgl.accessToken = mbtoken;

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: nrwMapboxStyleUrl,
            projection: 'mercator',
            attributionControl: true,
            center,
            zoom,
        });

        map.on('style.load', () => {
            setMapLoadComplete(true);
        });

        // Listener to enable/disable zoom buttons based current zoom level.
        const updateZoomLimits = () => {
            const z = map.getZoom();
            setZoomLimits({
                atMin: z <= map.getMinZoom(),
                atMax: z >= map.getMaxZoom(),
            });
        };
        map.on('zoom', updateZoomLimits);
        updateZoomLimits();

        map.on('moveend', () => {
            onMapViewChangeRef.current(
                map.getZoom() as Zoom,
                map.getCenter().lat as Latitude,
                map.getCenter().lng as Longitude,
            );
        });

        setMapboxMap(map);

        // Cleanup.
        return () => {
            setMapboxMap(undefined);
            setMapLoadComplete(false);
            map.remove();
        };
    // Set the dependencies to empty since we want this to run exactly once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // The country bounds arrive after the map is created.
    useEffect(() => {
        if (isNotDefined(mapboxMap) || isNotDefined(fitBounds)) {
            return;
        }

        mapboxMap.fitBounds(fitBounds, { padding: paddingPixels });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapboxMap, southWest?.lng, southWest?.lat, northEast?.lng, northEast?.lat]);

    const mapContext = useMemo(
        () => ({ map: mapLoadComplete ? mapboxMap : undefined }),
        [mapboxMap, mapLoadComplete],
    );

    return (
        <>
            <div className={styles.mapWrapper}>
                <div
                    ref={containerRef}
                    className={styles.nrwMapContainer}
                />
                <div className={styles.zoomControls}>
                    <button
                        type="button"
                        className={styles.zoomButton}
                        aria-label="Zoom in"
                        title="Zoom in"
                        disabled={zoomLimits.atMax}
                        onClick={() => mapboxMap?.zoomIn()}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                    <button
                        type="button"
                        className={styles.zoomButton}
                        aria-label="Zoom out"
                        title="Zoom out"
                        disabled={zoomLimits.atMin}
                        onClick={() => mapboxMap?.zoomOut()}
                    >
                        <FontAwesomeIcon icon={faMinus} />
                    </button>
                </div>
                <button
                    type="button"
                    className={styles.layersButton}
                    aria-label="Layers"
                    aria-expanded={isLayerPanelOpen}
                    onClick={() => setIsLayerPanelOpen((open) => !open)}
                >
                    <FontAwesomeIcon icon={faLayerGroup} />
                </button>
                {isLayerPanelOpen && layerPanel}
            </div>
            <NrwMapContext.Provider value={mapContext}>
                {children}
            </NrwMapContext.Provider>
        </>
    );
}

export default NrwMapContainer;
