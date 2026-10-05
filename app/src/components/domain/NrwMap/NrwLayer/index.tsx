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

    if (layer.type === 'raster') {
        return (
            <NrwRasterLayer
                id={getMapLayerId(countryCodeIso3, layer.name)}
                countryCodeIso3={countryCodeIso3}
                name={layer.name}
                resourceId={'resourceId' in layer ? layer.resourceId : undefined}
                beforeId={getLayerAnchorId(layer.name)}
                isVisible={isVisible}
            />
        );
    } if (layer.type === 'shape') {
        return (
            <NrwShapeLayer
                id={getMapLayerId(countryCodeIso3, layer.name)}
                isVisible={isVisible}
                beforeId={getLayerAnchorId(layer.name)}
            />
        );
    }

    return null;
}

export default NrwLayer;
