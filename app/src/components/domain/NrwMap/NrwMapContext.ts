import { createContext } from 'react';
import { type Map as MapboxMap } from 'mapbox-gl-v3';

interface NrwMapContextProps {
    map: MapboxMap | undefined;
}

const NrwMapContext = createContext<NrwMapContextProps>({ map: undefined });

export default NrwMapContext;
