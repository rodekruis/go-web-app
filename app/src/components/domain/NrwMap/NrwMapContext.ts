import { createContext } from 'react';
import { type Map as MapboxMap } from 'mapbox-gl-v3';

interface NrwMapContextProps {
    map: MapboxMap | undefined;
    // Set while the map's initial view must not be overridden by layer fits.
    preserveInitialView?: boolean;
}

const NrwMapContext = createContext<NrwMapContextProps>({ map: undefined });

export default NrwMapContext;
