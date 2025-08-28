const DatabaseService = require('./databaseService');

class ItemsService {
    constructor(dbPath) {
        this.db = new DatabaseService(dbPath);
        this.isInitialized = false;
    }

    async initialize() {
        try {
            await this.db.initialize();
            this.isInitialized = true;
        } catch (error) {
            console.error("Error initializing items service:", error);
            throw error;
        }
    }

    async getAllItems() {
        if (!this.isInitialized) {
            throw new Error("Items service not initialized. Call initialize() first.");
        }
        return await this.db.getAllItems();
    }

    async getItemById(id) {
        if (!this.isInitialized) {
            throw new Error("Items service not initialized. Call initialize() first.");
        }
        const item = await this.db.getItemById(parseInt(id));
        if (!item) {
            const error = new Error("Item not found");
            error.status = 404;
            throw error;
        }
        return item;
    }

    async searchItems(query) {
        if (!this.isInitialized) {
            throw new Error("Items service not initialized. Call initialize() first.");
        }
        if (!query) {
            return await this.db.getAllItems();
        }
        return await this.db.searchItems(query);
    }

    async paginateItems(query, page = 1, limit = 10) {
        if (!this.isInitialized) {
            throw new Error("Items service not initialized. Call initialize() first.");
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
        const offset = (pageNum - 1) * limitNum;

        let items, totalItems;

        if (query) {
            // Search with pagination
            items = await this.db.searchItems(query, limitNum, offset);
            totalItems = await this.db.getSearchCount(query);
        } else {
            // Get all with pagination
            items = await this.db.getAllItems(limitNum, offset);
            totalItems = await this.db.getItemCount();
        }

        const totalPages = Math.ceil(totalItems / limitNum);

        return {
            items,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems,
                totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1,
            },
        };
    }

    async createItem(itemData) {
        if (!this.isInitialized) {
            throw new Error("Items service not initialized. Call initialize() first.");
        }

        const { name, category, price } = itemData;

        // Validate required fields
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            const error = new Error("Name is required and must be a non-empty string");
            error.status = 400;
            throw error;
        }

        if (!category || typeof category !== "string" || category.trim().length === 0) {
            const error = new Error("Category is required and must be a non-empty string");
            error.status = 400;
            throw error;
        }

        if (price === undefined || price === null || typeof price !== "number" || price < 0) {
            const error = new Error("Price is required and must be a non-negative number");
            error.status = 400;
            throw error;
        }

        const item = {
            name: name.trim(),
            category: category.trim(),
            price: Number(price),
        };

        return await this.db.createItem(item);
    }
}

// Singleton instance
let itemsServiceInstance = null;

function createItemsService(dataPath) {
    if (!itemsServiceInstance) {
        itemsServiceInstance = new ItemsService(dataPath);
    }
    return itemsServiceInstance;
}

function getItemsService() {
    if (!itemsServiceInstance) {
        throw new Error("Items service not created. Call createItemsService first.");
    }
    return itemsServiceInstance;
}

// Test helper to reset singleton
function __resetSingleton() {
    itemsServiceInstance = null;
}

module.exports = {
    createItemsService,
    getItemsService,
    __resetSingleton,
};
