import {
    type NrwLegendItem as NrwLegendItemType,
    NrwLegendType,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwLegendClasses from '../NrwLegendClasses';
import NrwLegendRamp from '../NrwLegendRamp';

function NrwLegendItem(props: {
    item: NrwLegendItemType;
}) {
    const { item } = props;

    switch (item.type) {
        case NrwLegendType.Gradient:
            return <NrwLegendRamp item={item} />;
        case NrwLegendType.Classes:
            return <NrwLegendClasses item={item} />;
        default:
            item satisfies never;
            return null;
    }
}

export default NrwLegendItem;
