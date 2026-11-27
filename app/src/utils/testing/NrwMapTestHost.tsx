import {
    type ReactNode,
    useMemo,
} from 'react';

import NrwMapContext from '#components/domain/NrwMap/mapbox/NrwMapContext';

import { type FakeNrwMap } from './nrwAdminAreaTesting';

// Mirrors NrwMapContainer, which provides the map only after its style has loaded.
function NrwMapTestHost(props: {
    map: FakeNrwMap['map'];
    preserveMapView?: boolean;
    children: ReactNode;
}) {
    const { map, preserveMapView, children } = props;

    const mapContext = useMemo(
        () => ({ map, preserveMapView }),
        [map, preserveMapView],
    );

    return (
        <NrwMapContext.Provider value={mapContext}>
            {children}
        </NrwMapContext.Provider>
    );
}

export default NrwMapTestHost;
