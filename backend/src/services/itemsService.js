const fs = require("fs").promises;
const path = require("path");

class ItemsService {
    constructor(dataPath) {
        this.dataPath = dataPath;
        this.items = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            const raw = await fs.readFile(this.dataPath, "utf8");
            this.items = JSON.parse(raw);
            this.isInitialized = true;
            console.log(`Items service initialized with ${this.items.length} items`);
        } catch (error) {
            console.error("Error loading items data:", error);
            this.items = [];
            this.isInitialized = true;
            console.log("Items service initialized with empty array");
        }
    }

    async getAllItems() {
        if (!this.isInitialized) {
            throw new Error("Items service not initialized. Call initialize() first.");
        }
        return [...this.items]; // Return a copy to prevent external mutations
    }

    async getItemById(id) {
        if (!this.isInitialized) {
            throw new Error("Items service not initialized. Call initialize() first.");
        }
        const item = this.items.find((i) => i.id === parseInt(id));
        if (!item) {
            const error = new Error("Item not found");
            error.status = 404;
            throw error;
        }
        return { ...item }; // Return a copy
    }

    async searchItems(query) {
        if (!this.isInitialized) {
            throw new Error("Items service not initialized. Call initialize() first.");
        }
        if (!query) return [...this.items];

        const searchTerm = query.toLowerCase();
        return this.items.filter((item) => {
            const nameMatch = item.name.toLowerCase().includes(searchTerm);
            const categoryMatch = item.category.toLowerCase().includes(searchTerm);
            return nameMatch || categoryMatch;
        });
    }

    async paginateItems(items, page = 1, limit = 10) {
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
        const offset = (pageNum - 1) * limitNum;
        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / limitNum);

        const paginatedResults = items.slice(offset, offset + limitNum);

        return {
            items: paginatedResults,
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
            id: Date.now(),
            name: name.trim(),
            category: category.trim(),
            price: Number(price),
        };

        // Add to in-memory array
        this.items.push(item);
        
        return { ...item }; // Return a copy
    }

    // Optional: Persist current state to file (for data safety)
    async persistToFile() {
        if (!this.isInitialized) {
            throw new Error("Items service not initialized. Call initialize() first.");
        }
        try {
            await fs.writeFile(this.dataPath, JSON.stringify(this.items, null, 2), "utf8");
            console.log("Items persisted to file");
        } catch (error) {
            console.error("Error persisting items data:", error);
            throw new Error("Failed to persist items data");
        }
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

module.exports = {
    createItemsService,
    getItemsService
};
