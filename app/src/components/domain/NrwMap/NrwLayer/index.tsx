import {
    type CountryCodeIso3,
    type NrwEvent,
    type NrwLayer,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwRasterLayer from './NrwRasterLayer';
import NrwShapeLayer from './NrwShapeLayer';

function getMapLayerId(countryCodeIso3: CountryCodeIso3, name: NrwLayer['name']) {
    return `layer-${countryCodeIso3}-${name}`;
}

function NrwLayer(props: {
    countryCodeIso3: CountryCodeIso3;
    alertClass: NrwEvent['alertClass'];
    layer: NrwLayer;
    isVisible: boolean;
}) {
    const {
        countryCodeIso3, alertClass, layer, isVisible,
    } = props;

    if (layer.type === 'raster') {
        return (
            <NrwRasterLayer
                id={getMapLayerId(countryCodeIso3, layer.name)}
                countryCodeIso3={countryCodeIso3}
                name={layer.name}
                isVisible={isVisible}
            />
        );
    } if (layer.type === 'shape') {
        return (
            <NrwShapeLayer
                id={getMapLayerId(countryCodeIso3, layer.name)}
                countryCodeIso3={countryCodeIso3}
                alertClass={alertClass}
                isVisible={isVisible}
            />
        );
    }

    return null;
}

export default NrwLayer;
