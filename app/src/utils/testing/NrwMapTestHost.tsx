import {
    type ReactNode,
    useMemo,
} from 'react';

import NrwMapContext from '#components/domain/NrwMap/mapbox/NrwMapContext';

import { type FakeNrwMap } from './nrwAdminAreaTesting';

// Mirrors NrwMapContainer, which provides the map only after its style has loaded.
function NrwMapTestHost(props: {
    map: FakeNrwMap['map'];
    preserveInitialView?: boolean;
    children: ReactNode;
}) {
    const { map, preserveInitialView, children } = props;

    const mapContext = useMemo(
        () => ({ map, preserveInitialView }),
        [map, preserveInitialView],
    );

    return (
        <NrwMapContext.Provider value={mapContext}>
            {children}
        </NrwMapContext.Provider>
    );
}

export default NrwMapTestHost;
