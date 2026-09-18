import { createContext } from 'react';

import {
    type LayerToggleHandler,
    type NrwLayer,
    type NrwLayerName,
} from '../types';

export interface NrwLayersContextProps {
    availableLayers: NrwLayer[] | undefined;
    visibleLayers: NrwLayerName[];
    onLayerToggle: LayerToggleHandler;
}

const NrwLayersContext = createContext<NrwLayersContextProps>({
    availableLayers: undefined,
    visibleLayers: [],
    onLayerToggle: () => {
        // eslint-disable-next-line no-console
        console.warn('NrwLayersContext::onLayerToggle called before it was initialized');
    },
});

export default NrwLayersContext;
