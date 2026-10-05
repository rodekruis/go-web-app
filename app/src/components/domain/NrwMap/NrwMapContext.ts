import { createContext } from 'react';
import { type Map as MapboxMap } from 'mapbox-gl-v3';

export interface NrwMapContextProps {
    map: MapboxMap | undefined;
    setMap: (map: MapboxMap | undefined) => void;
}

const NrwMapContext = createContext<NrwMapContextProps>({
    map: undefined,
    setMap: () => {},
});

export default NrwMapContext;
