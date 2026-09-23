import {
    createContext,
    useMemo,
    useState,
} from 'react';
import { type Map as MapboxMap } from 'mapbox-gl-v3';

interface NrwMapContextProps {
    map: MapboxMap | undefined;
    setMap: (map: MapboxMap | undefined) => void;
}

const NrwMapContext = createContext<NrwMapContextProps>({
    map: undefined,
    setMap: () => {},
});

// Provided by the view so components outside the map (e.g. the navbar) can
// reach the map once NrwMapContainer has loaded it.
export function useNrwMapContextValue(): NrwMapContextProps {
    const [map, setMap] = useState<MapboxMap>();
    return useMemo(() => ({ map, setMap }), [map]);
}

export default NrwMapContext;
