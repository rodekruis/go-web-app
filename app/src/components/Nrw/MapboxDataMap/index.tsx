/* eslint-disable @typescript-eslint/no-unused-vars */
import 'mapbox-gl-v3/dist/mapbox-gl.css';

import {
    type ReactNode,
    useEffect,
    useRef,
    useState,
} from 'react';
import { byPrefixAndName } from '@awesome.me/kit-92f09b5225/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import mapboxgl, { type Map as MapboxGLMap } from 'mapbox-gl-v3';

import { mbtoken } from '#config';
import useAlert from '#hooks/useAlert';
import {
    MAP_CONTAINER_ELEMENT_ID,
    NRW_MAPBOX_STYLE_URL,
} from '#utils/nrw/nrwConstants';
import { type AdminAreaDetails } from '#utils/nrw/nrwDataFetchHelpers';
import type {
    MapLayerFunctions,
    MapViewParameters,
    NrwMapboxLayer,
    OrderedMapLayer,
} from '#utils/nrw/nrwMapTypes';
import {
    getMapViewFromParameters,
    getMapViewParametersFromMap,
} from '#utils/nrw/nrwMapViewHelpers';
import { type EventResponseDto } from '#utils/nrw/shared-dtos';

import styles from './styles.module.css';

interface MapboxDataMapProps {
    // ISO_A3 code list of countries that the map is scoped to.
    scopedCountries: string[];

    // Details for the currently selected event (centroid, exposed areas)
    // Pass null when no event is selected
    selectedEvent?: EventResponseDto | null;

    // Initial map view from URL search params, if available
    initialMapView?: MapViewParameters | null;

    // Optional arg to expose the map layer functions to the data loader.
    // It is a function that takes the layer functions object as an argument.
    registerMapLayerFunctions?: (mapLayerFunctions: MapLayerFunctions) => void;

    // Interactable feature click callback (i.e. on clicking admin area)
    onSelect: (
        placeCode: string,
        details: AdminAreaDetails | null,
        mapView?: MapViewParameters,
    ) => void;

    // Callback for when map center/zoom change finishes
    // This will be hit a lot through map interaction, so don't run costly actions on it
    onViewChange?: (mapView: MapViewParameters) => void;

    // Layer panel rendered as an overlay when the layers button is pressed
    layerPanel: ReactNode;
}

/**
 * Mapbox v3 map component for NRW data maps.
 * Data layers are added via the exposed map layer functions.
 */
export default function MapboxDataMap({
    scopedCountries,
    selectedEvent,
    initialMapView,
    registerMapLayerFunctions,
    onSelect,
    onViewChange,
    layerPanel,
}: MapboxDataMapProps) {
    const notification = useAlert();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<MapboxGLMap | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
    // Layer ids of added data layers and draw order value, sorted by draw order.
    // Mapbox uses list position to determine draw order.
    const orderedLayersRef = useRef<OrderedMapLayer[]>([]);
    // The exposed admin areas layer for the currently selected event, if any
    const exposedAreasLayerRef = useRef<NrwMapboxLayer | null>(null);
    // Callback tracked by ref in case it changes
    const onSelectRef = useRef(onSelect);
    const onViewChangeRef = useRef(onViewChange);

    useEffect(() => {
        onSelectRef.current = onSelect;
    }, [onSelect]);

    useEffect(() => {
        onViewChangeRef.current = onViewChange;
    }, [onViewChange]);

    // Initialize the Mapbox map instance
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) {
            return undefined;
        }

        mapboxgl.accessToken = mbtoken;
        const { center, zoom } = getMapViewFromParameters(initialMapView);

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: NRW_MAPBOX_STYLE_URL,
            projection: 'mercator',
            center,
            zoom,
            attributionControl: true,
            // Required so the map canvas can be captured for PDF export.
            preserveDrawingBuffer: true,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

        map.on('load', () => {
            setIsMapLoaded(true);
        });

        // Update map view state after each pan/zoom end
        map.on('moveend', () => {
            const mapView = getMapViewParametersFromMap(map);
            if (!mapView) {
                return;
            }

            onViewChangeRef.current?.(mapView);
        });

        mapInstanceRef.current = map;

        return () => {
            // Clean up on unmount
            orderedLayersRef.current = [];
            exposedAreasLayerRef.current = null;
            mapInstanceRef.current?.remove();
            mapInstanceRef.current = null;
            setIsMapLoaded(false);
        };
    // Set the dependencies to empty since this only runs on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.mapWrapper}>
                <div
                    id={MAP_CONTAINER_ELEMENT_ID}
                    ref={mapContainerRef}
                    className={styles.map}
                />
                <div
                    className={styles.layerPanelOverlay}
                    // Keep the panel mounted so deeplinked layers load on mount,
                    // but hide it visually until the user opens it.
                    hidden={!isLayerPanelOpen}
                >
                    {layerPanel}
                </div>
                <button
                    type="button"
                    className={styles.layersButton}
                    aria-label="Layers"
                    aria-expanded={isLayerPanelOpen}
                    onClick={() => setIsLayerPanelOpen((prev) => !prev)}
                    // Hide this for now until the layer panel is implemented and ready
                    hidden
                >
                    <FontAwesomeIcon icon={byPrefixAndName.far!['layer-group']!} />
                </button>

            </div>
        </div>
    );
}
