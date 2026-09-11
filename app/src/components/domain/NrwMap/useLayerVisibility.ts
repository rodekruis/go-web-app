import {
    useCallback,
    useState,
} from 'react';

import { type NrwLayer } from '#views/CountryProfileNationalRiskWatch/types';

const defaultVisibleLayerNames: ReadonlySet<NrwLayer['name']> = new Set(['population']);
type LayerOverrides = Partial<Record<NrwLayer['name'], boolean>>;

function useLayerVisibility() {
    const [layerOverrides, setLayerOverrides] = useState<LayerOverrides>({});

    const isLayerVisible = useCallback(
        (name: NrwLayer['name']) => (
            layerOverrides[name] ?? defaultVisibleLayerNames.has(name)
        ),
        [layerOverrides],
    );

    const toggleLayer = useCallback(
        (name: NrwLayer['name']) => {
            setLayerOverrides((prev) => ({
                ...prev,
                [name]: !(prev[name] ?? defaultVisibleLayerNames.has(name)),
            }));
        },
        [],
    );

    return { isLayerVisible, toggleLayer };
}

export default useLayerVisibility;
