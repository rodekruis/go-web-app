// Helpers for map interactions, including for admin areas
// since these are the main interactive feature on the map.

import { type FeatureLike } from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import type BaseLayer from 'ol/layer/Base';
import VectorLayer from 'ol/layer/Vector';
import type MapOl from 'ol/Map.js';
import { toLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';

import {
    noCountrySelectedValue,
    PLACE_CODE_FIELD_KEY,
} from './nrwConstants';
import {
    type AdminAreaDetails,
    getAdminAreaDetailsFromProperties,
} from './nrwDataFetchHelpers';
import { getAdminAreaZIndex } from './nrwMapHelpers';
import {
    styleAdminForEvent,
    styleAdminNoEvent,
} from './nrwMapStyles';
import {
    AlertClassType,
    type SelectedEventMapDetails,
} from './nrwMapTypes';
import {
    getAdminAreasByCodesUrl,
    getAdminRegionUrl,
    getNestedAdminUrl,
} from './nrwUrls';

// Fit the map view to a feature's geometry with animation
function fitToFeature(state: MapViewState, feature: FeatureLike) {
    const geometry = feature.getGeometry?.();
    if (!geometry) return;
    state.mapInstance?.getView().fit(geometry.getExtent(), {
        duration: 500,
        padding: [50, 50, 50, 50],
    });
}

export interface MapViewState {
  mapInstance: MapOl | null;

  // Map of the selected codes, indexed by the admin level (level 1, 2, 3, 4).
  // TODO: support variable max admin levels (2, 3 or 4) for here, and throughout the code
  // See task: https://dev.azure.com/redcrossnl/IBF/_workitems/edit/41768
  selectedAdminCodes: Map<number, string | null>;

  // Deepest admin level of the current view
  currentViewLevel: number;

  // Details for the currently selected event.
  // Null when no event is selected.
  selectedEvent: SelectedEventMapDetails | null;
}

export interface MapSelectionView {
    zoom: number;
    center: {
        lon: number;
        lat: number;
    };
}

function getCurrentMapSelectionView(state: MapViewState): MapSelectionView | undefined {
    const view = state.mapInstance?.getView();
    const center = view?.getCenter();
    const zoom = view?.getZoom();

    if (!center || zoom === undefined) {
        return undefined;
    }

    const [lon, lat] = toLonLat(center);
    if (lon === undefined || lat === undefined
        || !Number.isFinite(lon) || !Number.isFinite(lat)) {
        return undefined;
    }

    return {
        zoom,
        center: {
            lon,
            lat,
        },
    };
}

// Create a styled VectorLayer for an admin level, loading its geometry from the given url
function createAdminLayerFromUrl(
    state: MapViewState,
    adminLevel: 1 | 2 | 3 | 4,
    url: string,
): VectorLayer {
    const layer = new VectorLayer({
        source: new VectorSource({
            url,
            format: new GeoJSON(),
        }),
        style: (feature) => {
            const code = feature.get(PLACE_CODE_FIELD_KEY);
            const event = state.selectedEvent;
            const isEventSelected = event !== null;
            const selectedCode = state.selectedAdminCodes.get(adminLevel) ?? null;
            if (isEventSelected) {
                const levelKeys = Object.keys(event.exposedPopulationByLevel).map(Number);
                const deepestExposedLevel = levelKeys.at(-1);
                const isDeepestLevel = adminLevel === deepestExposedLevel;
                return styleAdminForEvent(
                    code,
                    isDeepestLevel ? selectedCode : null,
                    event?.exposedPopulationByLevel[adminLevel] ?? null,
                    event?.highestExposedPopulationByLevel[adminLevel] ?? 0,
                    event?.alertClass ?? AlertClassType.High,
                    isDeepestLevel,
                );
            }
            return styleAdminNoEvent(code, selectedCode, adminLevel);
        },
    });

    layer.setZIndex(getAdminAreaZIndex(adminLevel));
    return layer;
}

// Create a VectorLayer for the given admin level
export function createAdminLayer(
    state: MapViewState,
    adminLevel: 1 | 2 | 3 | 4,
    country: string,
    parentCode?: string,
): VectorLayer {
    // For admin level 1, get all admin areas for that level.
    // For others, just get children of a given parent code.
    const url = adminLevel === 1
        ? getAdminRegionUrl(country, 1)
        : getNestedAdminUrl(country!, parentCode!, adminLevel);

    return createAdminLayerFromUrl(state, adminLevel, url);
}

// Create a VectorLayer for a specific set of admin areas.
// This can batch together multiple areas into one request for when
// they don't have a shared parent code.
export function createAdminLayerForPlaceCodes(
    state: MapViewState,
    adminLevel: 1 | 2 | 3 | 4,
    country: string,
    placeCodes: string[],
): VectorLayer {
    const url = getAdminAreasByCodesUrl(country, adminLevel, placeCodes);

    return createAdminLayerFromUrl(state, adminLevel, url);
}

// Handle a click on a map feature (admin region or event).
// Returns an object describing what happened so the caller can
// manage layers and animations.
export function handleFeatureClick(
    state: MapViewState,
    feature: FeatureLike,
    layer: BaseLayer,
    adminLayers: Map<number, VectorLayer>,
    onSelect: (
        placeCode: string,
        details: AdminAreaDetails | null,
        mapView?: MapSelectionView,
    ) => void,
): {
  showChildLevel: 2 | 3 | 4;
  parentCode: string;
} | void {
    const properties = feature.getProperties();
    const adminDetails = getAdminAreaDetailsFromProperties(properties);

    // Print out all features of the item clicked on.
    // Use only for DEV builds.
    if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
        console.log('Clicked feature properties:', properties);
    }

    const newSelectedRegionCode = adminDetails?.code || noCountrySelectedValue;

    let processAdmin3Clicks = layer === adminLayers.get(3);
    if (processAdmin3Clicks && state.selectedEvent) {
        const exposedRegions = state.selectedEvent.exposedPopulationByLevel[3] ?? {};
        if (!(newSelectedRegionCode in exposedRegions)) {
            processAdmin3Clicks = false;
        }
    }

    // Clicked on admin3 layer
    if (processAdmin3Clicks) {
        onSelect(newSelectedRegionCode, adminDetails, getCurrentMapSelectionView(state));
        state.selectedAdminCodes.set(3, newSelectedRegionCode);
        adminLayers.forEach((adminLayer) => adminLayer.changed());

        fitToFeature(state, feature);
        return;
    }

    // Handle clicks for admin1 and 2
    // For current design, the user can't interact with these is an event is selected.
    if (!state.selectedEvent) {
        let selectedLayer: VectorLayer | null = null;
        let level = 1;
        // Only 2 and 3 are valid child levels
        let childLevel: 2 | 3 = 2;

        // Clicked on admin1 and 2 handling layer
        if (layer === adminLayers.get(2)) {
            selectedLayer = adminLayers.get(2) ?? null;
            level = 2;
            childLevel = 3;
        } else if (layer === adminLayers.get(1)) {
            selectedLayer = adminLayers.get(1) ?? null;
            // use defaults for level and childLevel
        }

        if (selectedLayer) {
            onSelect(newSelectedRegionCode, adminDetails, getCurrentMapSelectionView(state));
            state.selectedAdminCodes.set(level, newSelectedRegionCode);
            selectedLayer.changed();
            fitToFeature(state, feature);

            // eslint-disable-next-line consistent-return
            return {
                showChildLevel: childLevel,
                parentCode: newSelectedRegionCode,
            };
        }
    }

    state.selectedAdminCodes.set(0, newSelectedRegionCode);
}
