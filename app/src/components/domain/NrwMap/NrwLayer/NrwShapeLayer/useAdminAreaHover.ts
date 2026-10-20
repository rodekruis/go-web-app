import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import { type MapMouseEvent } from 'mapbox-gl-v3';

import NrwLngLat from '#views/CountryProfileNationalRiskWatch/NrwLngLat';
import {
    type AdminAreaProperties,
    type Latitude,
    type Longitude,
    type NrwAdminAreaFeatureCollection,
    type PlaceCode,
    type PlaceCodeChangeHandler,
} from '#views/CountryProfileNationalRiskWatch/types';
import {
    getAdminAreaAnchor,
    parseAdminAreaProperties,
} from '#views/CountryProfileNationalRiskWatch/utils';

import NrwMapContext from '../../NrwMapContext';

// pointer: when the mouse is over the admin area on the map
// area: when the mouse is over the admin area in the event card
export type HoveredAdminAreaAnchor = 'pointer' | 'area';

interface HoveredAdminArea extends AdminAreaProperties {
    coordinates: NrwLngLat;
    anchor: HoveredAdminAreaAnchor;
}

function useAdminAreaHover(
    layerId: string,
    isEnabled: boolean,
    adminAreas: NrwAdminAreaFeatureCollection | undefined,
    hoveredPlaceCode: PlaceCode | undefined,
    onHoverChange: PlaceCodeChangeHandler,
    canDrillDown: (placeCode: PlaceCode) => boolean,
) {
    const { map } = useContext(NrwMapContext);
    const [hoveredAdminArea, setHoveredAdminArea] = useState<HoveredAdminArea>();

    // canDrillDown changes identity every render. We don't want to re-register
    // the mousemove listener.
    const canDrillDownRef = useRef(canDrillDown);
    useEffect(
        () => {
            canDrillDownRef.current = canDrillDown;
        },
        [canDrillDown],
    );

    const clearHover = useCallback(
        () => {
            if (isDefined(map) && isDefined(map.style)) {
                map.getCanvas().style.cursor = '';
            }
            setHoveredAdminArea(undefined);
            onHoverChange(undefined);
        },
        [map, onHoverChange],
    );

    useEffect(
        () => {
            if (isNotDefined(map) || !isEnabled) {
                return undefined;
            }

            const handleMouseMove = (event: MapMouseEvent) => {
                const properties = parseAdminAreaProperties(event.features?.[0]?.properties);

                if (properties === null) {
                    return;
                }

                // Show "clickable" pointer cursor only for admin areas that can
                // be drilled into. Default to drag cursor.
                map.getCanvas().style.cursor = canDrillDownRef.current(properties.placeCode) ? 'pointer' : '';
                setHoveredAdminArea({
                    ...properties,
                    coordinates: new NrwLngLat(
                        event.lngLat.lng as Longitude,
                        event.lngLat.lat as Latitude,
                    ),
                    anchor: 'pointer',
                });
                onHoverChange(properties.placeCode);
            };

            map.on('mousemove', layerId, handleMouseMove);
            map.on('mouseleave', layerId, clearHover);

            return () => {
                map.off('mousemove', layerId, handleMouseMove);
                map.off('mouseleave', layerId, clearHover);
                clearHover();
            };
        },
        [map, layerId, isEnabled, clearHover, onHoverChange],
    );

    // Features are keyed by place code.
    useEffect(
        () => {
            if (isNotDefined(map) || !isEnabled || isNotDefined(map.getSource(layerId))) {
                return undefined;
            }

            if (isDefined(hoveredPlaceCode)) {
                map.setFeatureState({ source: layerId, id: hoveredPlaceCode }, { hover: true });
            }

            return () => {
                if (isDefined(map.style) && isDefined(map.getSource(layerId))) {
                    map.removeFeatureState({ source: layerId });
                }
            };
        },
        [map, layerId, isEnabled, hoveredPlaceCode],
    );

    const anchoredAdminArea = useMemo<HoveredAdminArea | undefined>(
        () => {
            if (isDefined(hoveredAdminArea) || !isEnabled || isNotDefined(hoveredPlaceCode)) {
                return undefined;
            }

            const feature = adminAreas?.features.find(
                ({ properties }) => properties.placeCode === hoveredPlaceCode,
            );

            if (isNotDefined(feature)) {
                return undefined;
            }

            const properties = parseAdminAreaProperties(feature.properties);
            const coordinates = getAdminAreaAnchor(feature);

            return properties !== null && isDefined(coordinates)
                ? { ...properties, coordinates, anchor: 'area' }
                : undefined;
        },
        [hoveredAdminArea, isEnabled, adminAreas, hoveredPlaceCode],
    );

    return { hoveredAdminArea: hoveredAdminArea ?? anchoredAdminArea, clearHover };
}

export default useAdminAreaHover;
