class MockDatabaseService {
    constructor() {
        this.items = [];
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
        // Start with some default test data
        this.items = [
            { id: 1, name: "Test Item 1", category: "Electronics", price: 100 },
            { id: 2, name: "Test Item 2", category: "Books", price: 50 },
            { id: 3, name: "Test Item 3", category: "Electronics", price: 200 },
            { id: 4, name: "Test Item 4", category: "Books", price: 25 },
            { id: 5, name: "Test Item 5", category: "Electronics", price: 150 },
        ];
    }

    async createTables() {
        // Mock implementation
    }

    async getItemCount() {
        return this.items.length;
    }

    async migrateFromJson() {
        // Mock implementation
    }

    async insertItem(item) {
        const newItem = {
            id: this.items.length + 1,
            ...item,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        this.items.push(newItem);
        return newItem;
    }

    async getAllItems(limit = null, offset = 0) {
        let result = [...this.items];
        if (limit) {
            result = result.slice(offset, offset + limit);
        }
        return result;
    }

    async getItemById(id) {
        const item = this.items.find(item => item.id === parseInt(id));
        if (!item) {
            const error = new Error("Item not found");
            error.status = 404;
            throw error;
        }
        return JSON.parse(JSON.stringify(item)); // Deep copy to prevent mutation
    }

    async searchItems(query, limit = null, offset = 0) {
        const searchTerm = query.toLowerCase();
        let results = this.items.filter((item) => item.name.toLowerCase().includes(searchTerm) || item.category.toLowerCase().includes(searchTerm));

        if (limit) {
            results = results.slice(offset, offset + limit);
        }
        return results;
    }

    async getSearchCount(query) {
        const searchTerm = query.toLowerCase();
        return this.items.filter((item) => item.name.toLowerCase().includes(searchTerm) || item.category.toLowerCase().includes(searchTerm)).length;
    }

    async paginateItems(query = null, page = 1, limit = 10) {
        page = Math.max(1, parseInt(page) || 1);
        limit = Math.max(1, Math.min(100, parseInt(limit) || 10));
        
        let items;
        if (query) {
            items = await this.searchItems(query);
        } else {
            items = [...this.items];
        }

        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / limit);
        const offset = (page - 1) * limit;
        const paginatedItems = items.slice(offset, offset + limit);

        return {
            items: paginatedItems,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }

    async createItem(item) {
        return await this.insertItem(item);
    }

    async upsertItem(item) {
        // Check if item with same name exists (case-insensitive)
        const existingIndex = this.items.findIndex(
            existing => existing.name.toLowerCase() === item.name.toLowerCase()
        );
        
        if (existingIndex !== -1) {
            // Update existing item
            const updatedItem = {
                ...this.items[existingIndex],
                name: item.name.trim().toLowerCase(),
                category: item.category.trim().toLowerCase(),
                price: item.price,
                updated_at: new Date().toISOString(),
            };
            this.items[existingIndex] = updatedItem;
            return updatedItem;
        } else {
            // Insert new item
            const newItem = {
                id: this.items.length + 1,
                name: item.name.trim().toLowerCase(),
                category: item.category.trim().toLowerCase(),
                price: item.price,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            this.items.push(newItem);
            return newItem;
        }
    }

    async getStats() {
        const total = this.items.length;
        const averagePrice = total > 0 ? this.items.reduce((acc, item) => acc + item.price, 0) / total : 0;

        return {
            total,
            averagePrice,
            lastUpdated: new Date().toISOString(),
        };
    }

    async close() {
        // Mock implementation
    }

    // Test helper methods
    setItems(items) {
        this.items = items;
    }

    clearItems() {
        this.items = [];
    }
}

module.exports = MockDatabaseService;
