import {
    type NrwLegendItem as NrwLegendItemType,
    NrwLegendType,
} from '#views/CountryProfileNationalRiskWatch/types';

import NrwLegendCategories from './NrwLegendCategories';
import NrwLegendRamp from './NrwLegendRamp';

function NrwLegendItem(props: {
    item: NrwLegendItemType;
}) {
    const { item } = props;

    switch (item.type) {
        case NrwLegendType.Gradient:
            return <NrwLegendRamp item={item} />;
        case NrwLegendType.Categories:
            return <NrwLegendCategories item={item} />;
        default:
            item satisfies never;
            return null;
    }
}

export default NrwLegendItem;
