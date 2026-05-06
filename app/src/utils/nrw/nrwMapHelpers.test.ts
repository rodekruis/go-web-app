import { expect, test, describe } from 'vitest';
import { getSelectedEventMapDetails } from './nrwMapHelpers';
import type {
    AllEventsData,
    EventAdminAreaData,
    EventOverviewData,
    AlertClassType,
    HazardType,
} from './nrwMapTypes';

// Helper function to create test event data
function createMockEventData(overrides?: Partial<EventOverviewData>): EventOverviewData {
    return {
        hazardTypes: ['flood'] as HazardType[],
        eventName: 'Test Flood Event',
        eventId: 'event-123',
        alertClass: 'high' as AlertClassType,
        trigger: true,
        centroid: [20.5, -15.3],
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-01-10T00:00:00Z',
        reachesPeakAlertClassTime: '2024-01-05T00:00:00Z',
        firstIssuedAt: '2024-01-01T00:00:00Z',
        lastUpdatedAt: '2024-01-02T00:00:00Z',
        exposedAdminAreas: [
            [], // admin level 0
            [
                {
                    placeCode: 'ADMIN1_01',
                    adminLevel: 1,
                    name: 'Region 1',
                    exposure: [],
                },
                {
                    placeCode: 'ADMIN1_02',
                    adminLevel: 1,
                    name: 'Region 2',
                    exposure: [],
                },
            ],
            [
                {
                    placeCode: 'ADMIN2_01',
                    adminLevel: 2,
                    name: 'District 1',
                    exposure: [],
                },
            ],
        ],
        availableLayers: [],
        dataSources: [],
        ...overrides,
    };
}

describe('getSelectedEventMapDetails', () => {
    describe('valid event selection', () => {
        test('should extract map details from a valid event', () => {
            const mockEvent = createMockEventData();
            const allEventsData: AllEventsData = { 'event-123': mockEvent };

            const result = getSelectedEventMapDetails(allEventsData, 'event-123');

            expect(result).not.toBeNull();
            expect(result?.eventId).toBe('event-123');
            expect(result?.centroid).toEqual([20.5, -15.3]);
        });

        test('should build exposedRegionsByLevel map correctly', () => {
            const mockEvent = createMockEventData();
            const allEventsData: AllEventsData = { 'event-123': mockEvent };

            const result = getSelectedEventMapDetails(allEventsData, 'event-123');

            expect(result?.exposedRegionsByLevel).toBeDefined();
            expect(result?.exposedRegionsByLevel.get(1)).toEqual(['ADMIN1_01', 'ADMIN1_02']);
            expect(result?.exposedRegionsByLevel.get(2)).toEqual(['ADMIN2_01']);
        });

        test('should only include admin levels with exposed areas', () => {
            const mockEvent = createMockEventData();
            const allEventsData: AllEventsData = { 'event-123': mockEvent };

            const result = getSelectedEventMapDetails(allEventsData, 'event-123');

            // Level 0 is empty, should not be in the map
            expect(result?.exposedRegionsByLevel.has(0)).toBe(false);
            expect(result?.exposedRegionsByLevel.has(1)).toBe(true);
            expect(result?.exposedRegionsByLevel.has(2)).toBe(true);
        });

        test('should handle events with no exposed areas at some levels', () => {
            const mockEvent = createMockEventData({
                exposedAdminAreas: [[], [{ placeCode: 'A1', adminLevel: 1, name: 'R1', exposure: [] }]],
            });
            const allEventsData: AllEventsData = { 'event-123': mockEvent };

            const result = getSelectedEventMapDetails(allEventsData, 'event-123');

            expect(result?.exposedRegionsByLevel.size).toBe(1);
            expect(result?.exposedRegionsByLevel.get(1)).toEqual(['A1']);
        });
    });

    describe('edge cases with eventId', () => {
        test('should return null when eventId is null', () => {
            const mockEvent = createMockEventData();
            const allEventsData: AllEventsData = { 'event-123': mockEvent };

            const result = getSelectedEventMapDetails(allEventsData, null);

            expect(result).toBeNull();
        });

        test('should return null when eventId is empty string', () => {
            const mockEvent = createMockEventData();
            const allEventsData: AllEventsData = { 'event-123': mockEvent };

            const result = getSelectedEventMapDetails(allEventsData, '');

            expect(result).toBeNull();
        });

        test('should return null when eventId is not found in data', () => {
            const mockEvent = createMockEventData();
            const allEventsData: AllEventsData = { 'event-123': mockEvent };

            const result = getSelectedEventMapDetails(allEventsData, 'non-existent-event');

            expect(result).toBeNull();
        });
    });

    describe('handling missing or invalid exposedAdminAreas', () => {
        test('should handle event without exposedAdminAreas property', () => {
            const mockEvent = createMockEventData();
            // @ts-ignore - testing runtime behavior
            delete mockEvent.exposedAdminAreas;
            const allEventsData: AllEventsData = { 'event-123': mockEvent };

            const result = getSelectedEventMapDetails(allEventsData, 'event-123');

            expect(result).not.toBeNull();
            expect(result?.exposedRegionsByLevel.size).toBe(0);
        });

        test('should handle empty exposedAdminAreas array', () => {
            const mockEvent = createMockEventData({ exposedAdminAreas: [] });
            const allEventsData: AllEventsData = { 'event-123': mockEvent };

            const result = getSelectedEventMapDetails(allEventsData, 'event-123');

            expect(result?.exposedRegionsByLevel.size).toBe(0);
        });

        test('should skip empty admin area lists at each level', () => {
            const mockEvent = createMockEventData({
                exposedAdminAreas: [
                    [],
                    [],
                    [{ placeCode: 'A2', adminLevel: 2, name: 'D1', exposure: [] }],
                    [],
                ],
            });
            const allEventsData: AllEventsData = { 'event-123': mockEvent };

            const result = getSelectedEventMapDetails(allEventsData, 'event-123');

            expect(result?.exposedRegionsByLevel.size).toBe(1);
            expect(result?.exposedRegionsByLevel.get(2)).toEqual(['A2']);
        });

        test('should handle null entries in exposedAdminAreas', () => {
            const mockEvent = createMockEventData();
            // @ts-ignore - testing runtime behavior with null entry
            mockEvent.exposedAdminAreas[1] = null;
            const allEventsData: AllEventsData = { 'event-123': mockEvent };

            const result = getSelectedEventMapDetails(allEventsData, 'event-123');

            // Should skip the null level and process level 2
            expect(result?.exposedRegionsByLevel.has(1)).toBe(false);
            expect(result?.exposedRegionsByLevel.has(2)).toBe(true);
        });
    });

    describe('multiple events in data', () => {
        test('should correctly select from multiple events', () => {
            const event1 = createMockEventData({ eventId: 'event-1', centroid: [10, 20] });
            const event2 = createMockEventData({ eventId: 'event-2', centroid: [30, 40] });
            const allEventsData: AllEventsData = { 'event-1': event1, 'event-2': event2 };

            const result1 = getSelectedEventMapDetails(allEventsData, 'event-1');
            const result2 = getSelectedEventMapDetails(allEventsData, 'event-2');

            expect(result1?.centroid).toEqual([10, 20]);
            expect(result2?.centroid).toEqual([30, 40]);
        });
    });

    describe('exposed regions data preservation', () => {
        test('should preserve placeCode values in the exposed regions', () => {
            const mockEvent = createMockEventData({
                exposedAdminAreas: [
                    [],
                    [
                        { placeCode: 'PLACE_CODE_ABC', adminLevel: 1, name: 'Area 1', exposure: [] },
                        { placeCode: 'PLACE_CODE_XYZ', adminLevel: 1, name: 'Area 2', exposure: [] },
                    ],
                ],
            });
            const allEventsData: AllEventsData = { 'event-123': mockEvent };

            const result = getSelectedEventMapDetails(allEventsData, 'event-123');

            expect(result?.exposedRegionsByLevel.get(1))
                .toEqual(['PLACE_CODE_ABC', 'PLACE_CODE_XYZ']);
        });

        test('should maintain order of place codes', () => {
            const codes = ['FIRST', 'SECOND', 'THIRD'];
            const mockEvent = createMockEventData({
                exposedAdminAreas: [
                    [],
                    codes.map((code) => ({
                        placeCode: code,
                        adminLevel: 1,
                        name: `Area ${code}`,
                        exposure: [],
                    })),
                ],
            });
            const allEventsData: AllEventsData = { 'event-123': mockEvent };

            const result = getSelectedEventMapDetails(allEventsData, 'event-123');

            expect(result?.exposedRegionsByLevel.get(1)).toEqual(codes);
        });
    });
});
