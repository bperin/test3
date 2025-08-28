const fs = require("fs").promises;
const { createItemsService } = require("../itemsService");

// Mock fs module
jest.mock("fs", () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
    },
}));

const mockData = [
    { id: 1, name: "Laptop", category: "Electronics", price: 999.99 },
    { id: 2, name: "Coffee Mug", category: "Kitchen", price: 12.5 },
    { id: 3, name: "Notebook", category: "Office", price: 5.99 },
    { id: 4, name: "Smartphone", category: "Electronics", price: 699.0 },
    { id: 5, name: "Desk Chair", category: "Furniture", price: 149.99 },
];

describe("ItemsService", () => {
    let itemsService;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset singleton
        const { __resetSingleton } = require("../itemsService");
        __resetSingleton();
        itemsService = createItemsService("/fake/path/items.json");
        fs.readFile.mockResolvedValue(JSON.stringify(mockData));
        fs.writeFile.mockResolvedValue();
    });

    describe("initialize", () => {
        test("loads data from file successfully", async () => {
            await itemsService.initialize();

            expect(fs.readFile).toHaveBeenCalledWith("/fake/path/items.json", "utf8");
            expect(itemsService.isInitialized).toBe(true);
        });

        test("handles file read errors gracefully", async () => {
            fs.readFile.mockRejectedValue(new Error("File not found"));

            await itemsService.initialize();

            expect(itemsService.isInitialized).toBe(true);
            const items = await itemsService.getAllItems();
            expect(items).toEqual([]);
        });

        test("handles malformed JSON gracefully", async () => {
            fs.readFile.mockResolvedValue("invalid json");

            await itemsService.initialize();

            expect(itemsService.isInitialized).toBe(true);
            const items = await itemsService.getAllItems();
            expect(items).toEqual([]);
        });
    });

    describe("getAllItems", () => {
        test("returns all items after initialization", async () => {
            await itemsService.initialize();
            const items = await itemsService.getAllItems();

            expect(items).toEqual(mockData);
        });

        test("returns copy of items to prevent mutation", async () => {
            await itemsService.initialize();
            const items = await itemsService.getAllItems();

            items.push({ id: 999, name: "Test", category: "Test", price: 1 });

            const itemsAgain = await itemsService.getAllItems();
            expect(itemsAgain).toEqual(mockData);
        });

        test("throws error if not initialized", async () => {
            const { __resetSingleton } = require("../itemsService");
            __resetSingleton();
            const uninitializedService = createItemsService("/fake/path");
            await expect(uninitializedService.getAllItems()).rejects.toThrow("Items service not initialized");
        });
    });

    describe("getItemById", () => {
        beforeEach(async () => {
            await itemsService.initialize();
        });

        test("returns item by id", async () => {
            const item = await itemsService.getItemById(1);
            expect(item).toEqual(mockData[0]);
        });

        test("returns copy of item to prevent mutation", async () => {
            const item = await itemsService.getItemById(1);
            item.name = "Modified";

            const itemAgain = await itemsService.getItemById(1);
            expect(itemAgain.name).toBe("Laptop");
        });

        test("throws 404 error for non-existent item", async () => {
            await expect(itemsService.getItemById(999)).rejects.toMatchObject({
                message: "Item not found",
                status: 404,
            });
        });

        test("handles string id by parsing to int", async () => {
            const item = await itemsService.getItemById("1");
            expect(item).toEqual(mockData[0]);
        });

        test("throws error if not initialized", async () => {
            const { __resetSingleton } = require("../itemsService");
            __resetSingleton();
            const uninitializedService = createItemsService("/fake/path");
            await expect(uninitializedService.getItemById(1)).rejects.toThrow("Items service not initialized");
        });
    });

    describe("searchItems", () => {
        beforeEach(async () => {
            await itemsService.initialize();
        });

        test("returns all items when no query provided", async () => {
            const items = await itemsService.searchItems();
            expect(items).toEqual(mockData);
        });

        test("returns all items when empty query provided", async () => {
            const items = await itemsService.searchItems("");
            expect(items).toEqual(mockData);
        });

        test("searches by name case-insensitively", async () => {
            const items = await itemsService.searchItems("laptop");
            expect(items).toHaveLength(1);
            expect(items[0].name).toBe("Laptop");
        });

        test("searches by category case-insensitively", async () => {
            const items = await itemsService.searchItems("electronics");
            expect(items).toHaveLength(2);
            expect(items.every((item) => item.category === "Electronics")).toBe(true);
        });

        test("returns empty array when no matches found", async () => {
            const items = await itemsService.searchItems("nonexistent");
            expect(items).toEqual([]);
        });

        test("searches across both name and category", async () => {
            const items = await itemsService.searchItems("o"); // matches "Coffee", "Notebook", "Office", "Smartphone"
            expect(items.length).toBeGreaterThan(1);
        });

        test("throws error if not initialized", async () => {
            const { __resetSingleton } = require("../itemsService");
            __resetSingleton();
            const uninitializedService = createItemsService("/fake/path");
            await expect(uninitializedService.searchItems("test")).rejects.toThrow("Items service not initialized");
        });
    });

    describe("paginateItems", () => {
        test("paginates items correctly", async () => {
            const result = await itemsService.paginateItems(mockData, 1, 2);

            expect(result.items).toHaveLength(2);
            expect(result.items).toEqual(mockData.slice(0, 2));
            expect(result.pagination).toEqual({
                page: 1,
                limit: 2,
                totalItems: 5,
                totalPages: 3,
                hasNext: true,
                hasPrev: false,
            });
        });

        test("handles last page correctly", async () => {
            const result = await itemsService.paginateItems(mockData, 3, 2);

            expect(result.items).toHaveLength(1);
            expect(result.pagination.hasNext).toBe(false);
            expect(result.pagination.hasPrev).toBe(true);
        });

        test("uses default values for page and limit", async () => {
            const result = await itemsService.paginateItems(mockData);

            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(10);
        });

        test("caps limit at 100", async () => {
            const result = await itemsService.paginateItems(mockData, 1, 200);
            expect(result.pagination.limit).toBe(100);
        });

        test("enforces minimum limit of 1", async () => {
            const result = await itemsService.paginateItems(mockData, 1, 0);
            expect(result.pagination.limit).toBe(10); // Falls back to default when invalid
        });

        test("enforces minimum page of 1", async () => {
            const result = await itemsService.paginateItems(mockData, -5, 10);
            expect(result.pagination.page).toBe(1);
        });
    });

    describe("createItem", () => {
        beforeEach(async () => {
            await itemsService.initialize();
        });

        test("creates item successfully", async () => {
            const newItemData = {
                name: "New Product",
                category: "Test",
                price: 29.99,
            };

            const item = await itemsService.createItem(newItemData);

            expect(item).toMatchObject(newItemData);
            expect(item).toHaveProperty("id");
            expect(typeof item.id).toBe("number");
        });

        test("adds item to in-memory array", async () => {
            const newItemData = {
                name: "New Product",
                category: "Test",
                price: 29.99,
            };

            await itemsService.createItem(newItemData);
            const allItems = await itemsService.getAllItems();

            expect(allItems).toHaveLength(6);
            expect(allItems[5]).toMatchObject(newItemData);
        });

        test("trims whitespace from name and category", async () => {
            const newItemData = {
                name: "  Trimmed Product  ",
                category: "  Trimmed Category  ",
                price: 29.99,
            };

            const item = await itemsService.createItem(newItemData);

            expect(item.name).toBe("Trimmed Product");
            expect(item.category).toBe("Trimmed Category");
        });

        test("validates required name field", async () => {
            const invalidData = { category: "Test", price: 29.99 };

            await expect(itemsService.createItem(invalidData)).rejects.toMatchObject({
                message: "Name is required and must be a non-empty string",
                status: 400,
            });
        });

        test("validates name is non-empty string", async () => {
            const invalidData = { name: "   ", category: "Test", price: 29.99 };

            await expect(itemsService.createItem(invalidData)).rejects.toMatchObject({
                message: "Name is required and must be a non-empty string",
                status: 400,
            });
        });

        test("validates required category field", async () => {
            const invalidData = { name: "Test", price: 29.99 };

            await expect(itemsService.createItem(invalidData)).rejects.toMatchObject({
                message: "Category is required and must be a non-empty string",
                status: 400,
            });
        });

        test("validates price is non-negative number", async () => {
            const invalidData = { name: "Test", category: "Test", price: -10 };

            await expect(itemsService.createItem(invalidData)).rejects.toMatchObject({
                message: "Price is required and must be a non-negative number",
                status: 400,
            });
        });

        test("validates price is a number", async () => {
            const invalidData = { name: "Test", category: "Test", price: "invalid" };

            await expect(itemsService.createItem(invalidData)).rejects.toMatchObject({
                message: "Price is required and must be a non-negative number",
                status: 400,
            });
        });

        test("throws error if not initialized", async () => {
            const { __resetSingleton } = require("../itemsService");
            __resetSingleton();
            const uninitializedService = createItemsService("/fake/path");
            const itemData = { name: "Test", category: "Test", price: 10 };

            await expect(uninitializedService.createItem(itemData)).rejects.toThrow("Items service not initialized");
        });
    });

    describe("persistToFile", () => {
        beforeEach(async () => {
            await itemsService.initialize();
        });

        test("persists current state to file", async () => {
            await itemsService.persistToFile();

            expect(fs.writeFile).toHaveBeenCalledWith("/fake/path/items.json", JSON.stringify(mockData, null, 2), "utf8");
        });

        test("handles write errors", async () => {
            fs.writeFile.mockRejectedValue(new Error("Write failed"));

            await expect(itemsService.persistToFile()).rejects.toThrow("Failed to persist items data");
        });

        test("throws error if not initialized", async () => {
            const { __resetSingleton } = require("../itemsService");
            __resetSingleton();
            const uninitializedService = createItemsService("/fake/path");

            await expect(uninitializedService.persistToFile()).rejects.toThrow("Items service not initialized");
        });
    });
});
