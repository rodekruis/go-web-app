import { type GlofasStationData } from '../nrwMapTypes';

const mwiGlofasStation: GlofasStationData = {
    stationName: 'G5201 Station: Liwonde',
    locationName: 'Liwonde',
    lonLat: [35.2256, -15.0674],
    peakTime: '2026-05-10T06:00:00Z',
    maxDischarge: 1850.5,
    dischargeThresholds: [500, 800, 1200, 1600],
    triggerStatement: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud.',
};

const kenGlofasStation: GlofasStationData = {
    stationName: 'G3042 Station: Garissa',
    locationName: 'Garissa',
    lonLat: [39.6583, 0.4532],
    peakTime: '2026-05-12T12:00:00Z',
    maxDischarge: 920.3,
    dischargeThresholds: [200, 350, 500, 700],
    triggerStatement: 'Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis.',
};

const zmbGlofasStation: GlofasStationData = {
    stationName: 'G4410 Station: Mongu',
    locationName: 'Mongu',
    lonLat: [23.1524, -15.2547],
    peakTime: '2026-05-08T18:00:00Z',
    maxDischarge: 3200.0,
    dischargeThresholds: [1000, 1500, 2000, 2800],
    triggerStatement: 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae ultricies eget tempor sit amet.',
};

const zweGlofasStation: GlofasStationData = {
    stationName: 'G6105 Station: Beitbridge',
    locationName: 'Beitbridge',
    lonLat: [30.0000, -22.2167],
    peakTime: '2026-05-09T00:00:00Z',
    maxDischarge: 540.7,
    dischargeThresholds: [100, 200, 300, 450],
    triggerStatement: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis.',
};

const glofasStationByCountry: Record<string, GlofasStationData> = {
    MWI: mwiGlofasStation,
    KEN: kenGlofasStation,
    ZMB: zmbGlofasStation,
    ZWE: zweGlofasStation,
};

function getMockGlofasStationData(
    country: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _eventId: string,
): GlofasStationData | undefined {
    return glofasStationByCountry[country];
}

export default getMockGlofasStationData;
