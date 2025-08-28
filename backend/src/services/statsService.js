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
            const items = await this.itemsService.getAllItems();

            // Calculate stats with intentional heavy CPU calculation
            this.cachedStats = {
                total: items.length,
                averagePrice: items.length > 0 ? items.reduce((acc, cur) => acc + cur.price, 0) / items.length : 0,
                lastUpdated: new Date().toISOString(),
            };
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

module.exports = {
    createStatsService,
    getStatsService,
};
