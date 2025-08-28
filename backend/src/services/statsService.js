class StatsService {
    constructor(itemsService) {
        this.itemsService = itemsService;
        this.cachedStats = null;
        this.isInitialized = false;
    }

    async initialize() {
        await this.refreshStats();
        this.isInitialized = true;
        console.log("Stats service initialized with cached data");
    }

    async refreshStats() {
        try {
            // Ensure items service is initialized before accessing database
            if (!this.itemsService.isInitialized) {
                throw new Error("Items service not initialized");
            }
            // Use database-level aggregation instead of fetching all items
            this.cachedStats = await this.itemsService.db.getStats();
        } catch (error) {
            console.error("Error refreshing stats:", error);
            this.cachedStats = {
                total: 0,
                averagePrice: 0,
                lastUpdated: new Date().toISOString(),
            };
        }
    }

    getStats() {
        if (!this.isInitialized) {
            throw new Error("Stats service not initialized");
        }
        return this.cachedStats;
    }

    async invalidateCache() {
        await this.refreshStats();
        console.log("Stats cache invalidated and refreshed");
    }
}

// Singleton instance
let statsServiceInstance = null;

function createStatsService(itemsService) {
    if (!statsServiceInstance) {
        statsServiceInstance = new StatsService(itemsService);
    }
    return statsServiceInstance;
}

function getStatsService() {
    if (!statsServiceInstance) {
        throw new Error("Stats service not created. Call createStatsService first.");
    }
    return statsServiceInstance;
}

// Test helper to reset singleton
function __resetSingleton() {
    statsServiceInstance = null;
}

module.exports = {
    createStatsService,
    getStatsService,
    __resetSingleton,
};
