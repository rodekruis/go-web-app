import { createContext } from 'react';
import { type Map as MapboxMap } from 'mapbox-gl-v3';

interface NrwMapContextProps {
    map: MapboxMap | undefined;
    preserveMapView?: boolean;
}

const NrwMapContext = createContext<NrwMapContextProps>({ map: undefined });

export default NrwMapContext;
