const { createStatsService, getStatsService, __resetSingleton } = require("../statsService");

// Mock the ItemsService with database
const mockDatabase = {
    getStats: jest.fn(),
};

const mockItemsService = {
    db: mockDatabase,
    isInitialized: true,
};

describe("StatsService", () => {
    let statsService;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset singleton
        const { __resetSingleton } = require("../statsService");
        __resetSingleton();
        statsService = createStatsService(mockItemsService);
    });

    describe("initialize", () => {
        test("initializes successfully and calculates stats", async () => {
            mockDatabase.getStats.mockResolvedValue({
                total: 5,
                averagePrice: 373.494,
                lastUpdated: new Date().toISOString()
            });

            await statsService.initialize();

            expect(statsService.isInitialized).toBe(true);
            expect(mockDatabase.getStats).toHaveBeenCalled();
            
            const stats = statsService.getStats();
            expect(stats).toHaveProperty("total", 5);
            expect(stats).toHaveProperty("averagePrice");
            expect(stats).toHaveProperty("lastUpdated");
            expect(typeof stats.lastUpdated).toBe("string");
        });

        test("handles database errors gracefully", async () => {
            mockDatabase.getStats.mockRejectedValue(new Error("Database error"));

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
            mockDatabase.getStats.mockResolvedValue({
                total: 5,
                averagePrice: 373.494,
                lastUpdated: new Date().toISOString()
            });
            await statsService.initialize();
        });

        test("calculates correct stats from database", async () => {
            const expectedStats = {
                total: 3,
                averagePrice: 150.0,
                lastUpdated: new Date().toISOString()
            };
            mockDatabase.getStats.mockResolvedValue(expectedStats);
            
            await statsService.refreshStats();
            
            const stats = statsService.getStats();
            expect(stats.total).toBe(3);
            expect(stats.averagePrice).toBe(150.0);
            expect(stats.lastUpdated).toBeTruthy();
        });

        test("handles empty database", async () => {
            mockDatabase.getStats.mockResolvedValue({
                total: 0,
                averagePrice: 0,
                lastUpdated: new Date().toISOString()
            });
            
            await statsService.refreshStats();
            
            const stats = statsService.getStats();
            expect(stats.total).toBe(0);
            expect(stats.averagePrice).toBe(0);
            expect(stats.lastUpdated).toBeTruthy();
        });

        test("calculates average correctly for single item", async () => {
            mockDatabase.getStats.mockResolvedValue({
                total: 1,
                averagePrice: 50.0,
                lastUpdated: new Date().toISOString()
            });

            await statsService.refreshStats();

            const stats = statsService.getStats();
            expect(stats.total).toBe(1);
            expect(stats.averagePrice).toBe(50.0);
        });

        test("handles database errors", async () => {
            mockDatabase.getStats.mockRejectedValue(new Error("Database error"));

            await statsService.refreshStats();

            const stats = statsService.getStats();
            expect(stats).toEqual({
                total: 0,
                averagePrice: 0,
                lastUpdated: expect.any(String)
            });
        });

        test("updates lastUpdated timestamp", async () => {
            const beforeTime = Date.now() - 10; // Add small buffer
            await statsService.refreshStats();
            const afterTime = Date.now() + 10; // Add small buffer

            const stats = await statsService.getStats();
            const statsTime = new Date(stats.lastUpdated).getTime();
            
            expect(statsTime).toBeGreaterThanOrEqual(beforeTime);
            expect(statsTime).toBeLessThanOrEqual(afterTime);
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
            expect(mockDatabase.getStats).toHaveBeenCalledTimes(1); // Only called during initialize
        });
    });

    describe("invalidateCache", () => {
        beforeEach(async () => {
            await statsService.initialize();
        });

        test("refreshes stats when cache is invalidated", async () => {
            const originalStats = statsService.getStats();
            
            // Change mock database response
            mockDatabase.getStats.mockResolvedValue({
                total: 1,
                averagePrice: 100.0,
                lastUpdated: new Date().toISOString()
            });

            await new Promise(resolve => setTimeout(resolve, 1)); // Small delay to ensure different timestamp
            await statsService.invalidateCache();

            const newStats = statsService.getStats();
            expect(newStats.total).toBe(1);
            expect(newStats.averagePrice).toBe(100.0);
            expect(newStats.lastUpdated).not.toBe(originalStats.lastUpdated);
        });

        test("calls getStats again after invalidation", async () => {
            expect(mockDatabase.getStats).toHaveBeenCalledTimes(1); // From initialize

            await statsService.invalidateCache();

            expect(mockDatabase.getStats).toHaveBeenCalledTimes(2); // Called again
        });

        test("handles errors during cache invalidation", async () => {
            mockDatabase.getStats.mockRejectedValue(new Error("Database error"));

            await statsService.invalidateCache();

            const stats = statsService.getStats();
            expect(stats).toEqual({
                total: 0,
                averagePrice: 0,
                lastUpdated: expect.any(String)
            });
        });
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
