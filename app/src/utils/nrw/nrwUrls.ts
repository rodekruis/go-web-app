import { ibfApiBackend } from '#config';

import {
    adminLevelFieldKey,
    countryFieldKey,
} from './nrwConstants';

// Simplification algorithm factor for simplifying vector data.
// A larger factor returns a smaller, more simplified vector shape.
// Admin0 (country) borders are only needed to scope the zoom-to-fit bounds and
// are never displayed, so a high factor is used to keep the payload small.
// Example of factor values on vector object size:
//    full vector size: 300kb
//    .0005 = 279kb
//    .001 = 188kb
//    .01 = 53kb
//    .05 = 30kb
const simplificationFactor = 0.05;

const baseQuery = `${ibfApiBackend}admin-areas?filter=`;
const and = '%20AND%20';

// Build the admin-area query URL for a country at a given admin level.
export default function getAdminAreaUrl(
    countryIso3: string,
    adminLevel: number,
): string {
    const countryParam = `${countryFieldKey}=%27${countryIso3}%27`;
    const levelParam = `${adminLevelFieldKey}=${adminLevel}`;
    const limitParam = 'limit=10000';
    const simplifyParam = `transform=simplify,${simplificationFactor}`;

    return `${baseQuery}${countryParam}${and}${levelParam}&${limitParam}&${simplifyParam}`;
}
