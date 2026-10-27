import { type MapFlatStyle } from '#utils/nrw/colors';
import { type NrwAdminAreaFeatureCollection } from '#views/CountryProfileNationalRiskWatch/types';

import { type MapLayer } from '../useNrwMapLayers';
import { isHovered } from './getAdminAreaLayer';

// Build a layer of admin areas all in the same given style,
// unlike the choropleth of getAdminAreaLayer.
function getFlatAdminAreaLayer(
    id: string,
    adminAreas: NrwAdminAreaFeatureCollection,
    style: MapFlatStyle,
): MapLayer[] {
    return [
        {
            id,
            type: 'fill',
            source: {
                type: 'geojson',
                data: adminAreas as unknown as GeoJSON.FeatureCollection,
                promoteId: 'placeCode',
            },
            paint: {
                'fill-color': style.fillColor,
                'fill-opacity': ['case', isHovered, style.fillHoverOpacity, style.fillOpacity],
            },
        },
        {
            id: `${id}-outline`,
            type: 'line',
            source: id,
            paint: {
                'line-color': style.outlineColor,
                'line-opacity': style.outlineOpacity,
                'line-width': style.outlineWidth,
            },
        },
    ];
}

export default getFlatAdminAreaLayer;
