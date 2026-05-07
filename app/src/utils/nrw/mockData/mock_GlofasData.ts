import { type GlofasStationData } from '../nrwMapTypes';

const mwiGlofasStations: GlofasStationData[] = [
    {
        stationName: 'G5201 Station: Liwonde',
        locationName: 'Liwonde',
        lonLat: [35.2256, -15.0674],
        peakTime: '2026-05-10T06:00:00Z',
        maxDischarge: 1850.5,
        dischargeThresholds: [500, 800, 1200, 1600, 2200],
    },
];

const kenGlofasStations: GlofasStationData[] = [
    {
        stationName: 'G3042 Station: Garissa',
        locationName: 'Garissa',
        lonLat: [39.6583, 0.4532],
        peakTime: '2026-05-12T12:00:00Z',
        maxDischarge: 920.3,
        dischargeThresholds: [200, 350, 500, 700, 1100],
    },
];

const zmbGlofasStations: GlofasStationData[] = [
    {
        stationName: 'G4410 Station: Mongu',
        locationName: 'Mongu',
        lonLat: [23.1524, -15.2547],
        peakTime: '2026-05-08T18:00:00Z',
        maxDischarge: 3200.0,
        dischargeThresholds: [1000, 1500, 2000, 2800, 4000],
    },
];

const zweGlofasStations: GlofasStationData[] = [
    {
        stationName: 'G6105 Station: Beitbridge',
        locationName: 'Beitbridge',
        lonLat: [30.0000, -22.2167],
        peakTime: '2026-05-09T00:00:00Z',
        maxDischarge: 540.7,
        dischargeThresholds: [100, 200, 300, 450, 700],
    },
];

const glofasStationsByCountry: Record<string, GlofasStationData[]> = {
    mwi: mwiGlofasStations,
    ken: kenGlofasStations,
    zmb: zmbGlofasStations,
    zwe: zweGlofasStations,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getMockGlofasStationData(country: string, _eventId: string): GlofasStationData[] {
    return glofasStationsByCountry[country] ?? [];
}

export default getMockGlofasStationData;
