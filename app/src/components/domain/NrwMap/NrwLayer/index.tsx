import { isDefined } from '@togglecorp/fujs';

import { getLayerAnchorId } from '#utils/nrw/layers';
import {
    type CountryCodeIso3,
    type NrwLayer,
    type NrwLayerName,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwRasterLayer from './NrwRasterLayer';
import NrwShapeLayer from './NrwShapeLayer';

function getMapLayerId(countryCodeIso3: CountryCodeIso3, name: NrwLayerName): string {
    return `layer-${countryCodeIso3}-${name}`;
}

function NrwLayer(props: {
    countryCodeIso3: CountryCodeIso3;
    layer: NrwLayer;
    isVisible: boolean;
}) {
    const {
        countryCodeIso3, layer, isVisible,
    } = props;

    const resourceId = 'resourceId' in layer ? layer.resourceId : undefined;

    if (layer.type === 'shape' && isDefined(resourceId)) {
        // eslint-disable-next-line no-console
        console.error(`NrwLayer: shape layer '${layer.name}' should not have a resourceId`);
        return null;
    }

    switch (layer.type) {
        case 'raster':
            return (
                <NrwRasterLayer
                    id={getMapLayerId(countryCodeIso3, layer.name)}
                    countryCodeIso3={countryCodeIso3}
                    name={layer.name}
                    resourceId={resourceId}
                    beforeId={getLayerAnchorId(layer.name)}
                    isVisible={isVisible}
                />
            );
        case 'shape':
            return (
                <NrwShapeLayer
                    id={getMapLayerId(countryCodeIso3, layer.name)}
                    isVisible={isVisible}
                    beforeId={getLayerAnchorId(layer.name)}
                />
            );
        case 'point':
        case 'vectorTile':
            return null;
        default:
            layer.type satisfies never;
    }
}

export default NrwLayer;
