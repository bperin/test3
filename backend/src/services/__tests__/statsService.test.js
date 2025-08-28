const { createStatsService } = require("../statsService");

// Mock ItemsService
const mockItemsService = {
    getAllItems: jest.fn(),
};

const mockData = [
    { id: 1, name: "Laptop", category: "Electronics", price: 999.99 },
    { id: 2, name: "Coffee Mug", category: "Kitchen", price: 12.5 },
    { id: 3, name: "Notebook", category: "Office", price: 5.99 },
    { id: 4, name: "Smartphone", category: "Electronics", price: 699.0 },
    { id: 5, name: "Desk Chair", category: "Furniture", price: 149.99 },
];

describe("StatsService", () => {
    let statsService;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset singleton
        const { __resetSingleton } = require("../statsService");
        __resetSingleton();
        statsService = createStatsService(mockItemsService);
        mockItemsService.getAllItems.mockResolvedValue(mockData);
    });

    describe("initialize", () => {
        test("initializes successfully and calculates stats", async () => {
            await statsService.initialize();

            expect(statsService.isInitialized).toBe(true);
            expect(mockItemsService.getAllItems).toHaveBeenCalled();
            
            const stats = statsService.getStats();
            expect(stats).toHaveProperty("total", 5);
            expect(stats).toHaveProperty("averagePrice");
            expect(stats).toHaveProperty("lastUpdated");
        });

        test("handles items service errors gracefully", async () => {
            mockItemsService.getAllItems.mockRejectedValue(new Error("Service error"));

            await statsService.initialize();

            expect(statsService.isInitialized).toBe(true);
            const stats = statsService.getStats();
            expect(stats).toEqual({
                total: 0,
                averagePrice: 0,
                lastUpdated: expect.any(String)
            });
        });
    });

    describe("refreshStats", () => {
        beforeEach(async () => {
            await statsService.initialize();
        });

        test("calculates correct stats from items service", async () => {
            await statsService.refreshStats();

            const stats = statsService.getStats();
            const expectedAverage = mockData.reduce((acc, item) => acc + item.price, 0) / mockData.length;
            
            expect(stats.total).toBe(5);
            expect(stats.averagePrice).toBeCloseTo(expectedAverage, 2);
            expect(stats.lastUpdated).toBeTruthy();
        });

        test("handles empty items array", async () => {
            mockItemsService.getAllItems.mockResolvedValue([]);

            await statsService.refreshStats();

            const stats = statsService.getStats();
            expect(stats.total).toBe(0);
            expect(stats.averagePrice).toBe(0);
        });

        test("calculates average correctly for single item", async () => {
            const singleItem = [{ id: 1, name: "Test", category: "Test", price: 50.0 }];
            mockItemsService.getAllItems.mockResolvedValue(singleItem);

            await statsService.refreshStats();

            const stats = statsService.getStats();
            expect(stats.total).toBe(1);
            expect(stats.averagePrice).toBe(50.0);
        });

        test("handles items service errors", async () => {
            mockItemsService.getAllItems.mockRejectedValue(new Error("Service error"));

            await statsService.refreshStats();

            const stats = statsService.getStats();
            expect(stats).toEqual({
                total: 0,
                averagePrice: 0,
                lastUpdated: expect.any(String)
            });
        });

        test("updates lastUpdated timestamp", async () => {
            const beforeTime = new Date().toISOString();
            
            await new Promise(resolve => setTimeout(resolve, 1)); // Small delay to ensure different timestamp
            await statsService.refreshStats();
            
            const stats = statsService.getStats();
            const afterTime = new Date().toISOString();
            
            expect(stats.lastUpdated).toBeGreaterThanOrEqual(beforeTime);
            expect(stats.lastUpdated).toBeLessThanOrEqual(afterTime);
        });
    });

    describe("getStats", () => {
        test("returns cached stats after initialization", async () => {
            await statsService.initialize();

            const stats = statsService.getStats();

            expect(stats).toHaveProperty("total");
            expect(stats).toHaveProperty("averagePrice");
            expect(stats).toHaveProperty("lastUpdated");
            expect(typeof stats.total).toBe("number");
            expect(typeof stats.averagePrice).toBe("number");
            expect(typeof stats.lastUpdated).toBe("string");
        });

        test("throws error if not initialized", () => {
            expect(() => statsService.getStats()).toThrow("Stats service not initialized");
        });

        test("returns same stats on multiple calls without refresh", async () => {
            await statsService.initialize();

            const stats1 = statsService.getStats();
            const stats2 = statsService.getStats();

            expect(stats1).toEqual(stats2);
            expect(mockItemsService.getAllItems).toHaveBeenCalledTimes(1); // Only called during initialize
        });
    });

    describe("invalidateCache", () => {
        beforeEach(async () => {
            await statsService.initialize();
        });

        test("refreshes stats when cache is invalidated", async () => {
            const originalStats = statsService.getStats();
            
            // Change mock data
            const newMockData = [
                { id: 1, name: "New Item", category: "New", price: 100.0 }
            ];
            mockItemsService.getAllItems.mockResolvedValue(newMockData);

            await new Promise(resolve => setTimeout(resolve, 1)); // Small delay to ensure different timestamp
            await statsService.invalidateCache();

            const newStats = statsService.getStats();
            expect(newStats.total).toBe(1);
            expect(newStats.averagePrice).toBe(100.0);
            expect(newStats.lastUpdated).not.toBe(originalStats.lastUpdated);
        });

        test("calls getAllItems again after invalidation", async () => {
            expect(mockItemsService.getAllItems).toHaveBeenCalledTimes(1); // From initialize

            await statsService.invalidateCache();

            expect(mockItemsService.getAllItems).toHaveBeenCalledTimes(2); // Called again
        });

        test("handles errors during cache invalidation", async () => {
            mockItemsService.getAllItems.mockRejectedValue(new Error("Service error"));

            await statsService.invalidateCache();

            const stats = statsService.getStats();
            expect(stats).toEqual({
                total: 0,
                averagePrice: 0,
                lastUpdated: expect.any(String)
            });
        });
    });

    describe("edge cases", () => {
        beforeEach(async () => {
            await statsService.initialize();
        });

        test("handles items with zero prices", async () => {
            const zeroItems = [
                { id: 1, name: "Free Item", category: "Free", price: 0 },
                { id: 2, name: "Paid Item", category: "Paid", price: 100 }
            ];
            mockItemsService.getAllItems.mockResolvedValue(zeroItems);

            await statsService.refreshStats();

            const stats = statsService.getStats();
            expect(stats.total).toBe(2);
            expect(stats.averagePrice).toBe(50);
        });

        test("handles items with decimal prices", async () => {
            const decimalItems = [
                { id: 1, name: "Item 1", category: "Test", price: 10.33 },
                { id: 2, name: "Item 2", category: "Test", price: 20.67 }
            ];
            mockItemsService.getAllItems.mockResolvedValue(decimalItems);

            await statsService.refreshStats();

            const stats = statsService.getStats();
            expect(stats.total).toBe(2);
            expect(stats.averagePrice).toBeCloseTo(15.5, 2);
        });

        test("handles very large numbers", async () => {
            const largeItems = [
                { id: 1, name: "Expensive", category: "Luxury", price: 999999.99 }
            ];
            mockItemsService.getAllItems.mockResolvedValue(largeItems);

            await statsService.refreshStats();

            const stats = statsService.getStats();
            expect(stats.total).toBe(1);
            expect(stats.averagePrice).toBe(999999.99);
        });
    });

    describe("singleton behavior", () => {
        test("returns same instance when called multiple times", () => {
            const service1 = createStatsService(mockItemsService);
            const service2 = createStatsService(mockItemsService);

            expect(service1).toBe(service2);
        });

        test("getStatsService throws error when not created", () => {
            const { getStatsService, __resetSingleton } = require("../statsService");
            __resetSingleton();
            
            expect(() => getStatsService()).toThrow("Stats service not created");
        });
    });
});
