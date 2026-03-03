import { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BaseLayer from 'ol/layer/Base';
import 'ol/ol.css';
import { testStyle } from '#utils/ibfMapStyles';
import { OlDataMap } from './OlDataMap';
import { IbfControlPanel } from './IbfControlPanel';
import { IbfDataPanel } from './IbfDataPanel';
import { OlGlobalMap } from './OlGlobalMap';
import styles from './styles.module.css';
import { mapUrlCountryVectorTiles, mapUrlSimpleStyleJson } from '#utils/ibfMap';
import { debug_testImageName, makeMvtLayerAsync, makeStaticImageLayer } from '#utils/ibfMapHelpers';

// Search (query) parameter keys
const countrySearchParamsKey = 'c';

/**
 * Base map component for IBF data maps * 
 * This component manages multiple nested components including for map data fetching, display, and control. * 
 * @returns A standalone component
 */
export function IbfMapContainer() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize state directly from URL to avoid race condition
    const initialCountryCode = searchParams.get(countrySearchParamsKey)?.toUpperCase() || 'None';
    const [selectedCountry, setSelectedCountry] = useState<string>(initialCountryCode);
    const [isImageLayerLoading, setIsImageLayerLoading] = useState(false);
    const [isImageLayerLoaded, setIsImageLayerLoaded] = useState(false);
    const [isImageLayerVisible, setIsImageLayerVisible] = useState(false);

    // Stored add-layer function from OlDataMap
    const addLayerRef = useRef<((layer: BaseLayer) => void) | null>(null);

    // Cache the loaded image layer
    // When we support more data layers, we'll need one for each data layer we want to toggle.
    const imageLayerRef = useRef<BaseLayer | null>(null);

    const addDataLayer = useCallback((addLayer: (layer: BaseLayer) => void) => {
        addLayerRef.current = addLayer;
    }, []);

    const handleToggleImageLayer = useCallback(() => {
        // If layer is already loaded, just toggle visibility
        if (imageLayerRef.current) {
            const newVisibility = !isImageLayerVisible;
            imageLayerRef.current.setVisible(newVisibility);
            setIsImageLayerVisible(newVisibility);
            return;
        }

        // First time: load the layer
        if (!addLayerRef.current) {
            console.error('Map not ready yet');
            return;
        }

        setIsImageLayerLoading(true);
        makeStaticImageLayer(debug_testImageName)
            .then(imageLayer => {
                imageLayerRef.current = imageLayer;
                addLayerRef.current?.(imageLayer);
                setIsImageLayerLoaded(true);
                setIsImageLayerVisible(true);
                console.log('Added static image layer to map');
            })
            .catch(error => {
                console.error('Error loading static image layer:', error);
            })
            .finally(() => {
                setIsImageLayerLoading(false);
            });
    }, [isImageLayerVisible]);

    const handleCountrySelect = useCallback((country: string) => {
        setSelectedCountry(country);

        if (country) {
            setSearchParams({ [countrySearchParamsKey]: country });
        } else {
            setSearchParams({});
        }

    }, [setSearchParams]);

    return (
        <div className={styles.container}>
            <OlDataMap
                selectedCountry={selectedCountry}
                layer={makeMvtLayerAsync(selectedCountry, mapUrlCountryVectorTiles, testStyle)}
                mapStyleJsonUrl={mapUrlSimpleStyleJson}
                addLayerFunction={addDataLayer}
            />
            <IbfControlPanel
                onToggleImageLayer={handleToggleImageLayer}
                isLayerVisible={isImageLayerVisible}
            />
            <IbfDataPanel selectedCountry={selectedCountry} />

            <OlGlobalMap adminLevels={0} onSelect={handleCountrySelect} />
        </div>
    );
}
