const request = require("supertest");
const express = require("express");
const createItemsRouter = require("../items");

// Mock services
const mockItemsService = {
    searchItems: jest.fn(),
    paginateItems: jest.fn(),
    getItemById: jest.fn(),
    createItem: jest.fn(),
};

const mockStatsService = {
    invalidateCache: jest.fn(),
};

const app = express();
app.use(express.json());
app.use("/api/items", createItemsRouter(mockItemsService, mockStatsService));

// Error handler
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
});

const mockData = [
    { id: 1, name: "Laptop", category: "Electronics", price: 999.99 },
    { id: 2, name: "Coffee Mug", category: "Kitchen", price: 12.5 },
    { id: 3, name: "Notebook", category: "Office", price: 5.99 },
    { id: 4, name: "Smartphone", category: "Electronics", price: 699.0 },
    { id: 5, name: "Desk Chair", category: "Furniture", price: 149.99 },
];

describe("Items API Routes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockItemsService.searchItems.mockResolvedValue(mockData);
        mockItemsService.paginateItems.mockResolvedValue({
            items: mockData,
            pagination: {
                page: 1,
                limit: 10,
                totalItems: 5,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            },
        });
        mockStatsService.invalidateCache.mockResolvedValue();
    });

    describe("GET /api/items", () => {
        test("returns all items with default pagination", async () => {
            const response = await request(app).get("/api/items").expect(200);

            expect(response.body).toHaveProperty("items");
            expect(response.body).toHaveProperty("pagination");
            expect(response.body.items).toHaveLength(5);
            expect(response.body.pagination).toEqual({
                page: 1,
                limit: 10,
                totalItems: 5,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            });
            expect(mockItemsService.searchItems).toHaveBeenCalledWith(undefined);
            expect(mockItemsService.paginateItems).toHaveBeenCalledWith(mockData, "1", "10");
        });

        test("applies pagination correctly", async () => {
            const response = await request(app).get("/api/items?page=1&limit=2").expect(200);

            expect(response.body.items).toHaveLength(2);
            expect(response.body.pagination).toEqual({
                page: 1,
                limit: 2,
                totalItems: 5,
                totalPages: 3,
                hasNext: true,
                hasPrev: false,
            });
        });

        test("handles search query correctly", async () => {
            const response = await request(app).get("/api/items?q=electronics").expect(200);

            expect(response.body.items).toHaveLength(2);
            expect(response.body.items.every((item) => item.category.toLowerCase().includes("electronics"))).toBe(true);
        });

        test("search is case insensitive", async () => {
            const response = await request(app).get("/api/items?q=LAPTOP").expect(200);

            expect(response.body.items).toHaveLength(1);
            expect(response.body.items[0].name).toBe("Laptop");
        });

        test("handles invalid page numbers gracefully", async () => {
            const response = await request(app).get("/api/items?page=0").expect(200);

            expect(response.body.pagination.page).toBe(1);
        });

        test("caps limit at 100", async () => {
            const response = await request(app).get("/api/items?limit=200").expect(200);

            expect(response.body.pagination.limit).toBe(100);
        });

        test("handles minimum limit of 1", async () => {
            const response = await request(app).get("/api/items?limit=0").expect(200);

            expect(response.body.pagination.limit).toBe(1); // Math.max(1, 0) = 1
        });

        test("handles negative limit values", async () => {
            const response = await request(app).get("/api/items?limit=-5").expect(200);

            expect(response.body.pagination.limit).toBe(1);
        });

        test("handles non-numeric limit values", async () => {
            const response = await request(app).get("/api/items?limit=abc").expect(200);

            expect(response.body.pagination.limit).toBe(10); // Falls back to default
        });

        test("handles decimal limit values", async () => {
            const response = await request(app).get("/api/items?limit=2.7").expect(200);

            expect(response.body.pagination.limit).toBe(2);
        });

        test("handles file read errors", async () => {
            fs.readFile.mockRejectedValue(new Error("File not found"));

            await request(app).get("/api/items").expect(500);
        });
    });

    describe("GET /api/items/:id", () => {
        test("returns specific item by id", async () => {
            const response = await request(app).get("/api/items/1").expect(200);

            expect(response.body).toEqual(mockData[0]);
        });

        test("returns 404 for non-existent item", async () => {
            const response = await request(app).get("/api/items/999").expect(404);

            expect(response.body).toHaveProperty("error", "Item not found");
        });

        test("handles invalid id format", async () => {
            const response = await request(app).get("/api/items/abc").expect(404);

            expect(response.body).toHaveProperty("error", "Item not found");
        });

        test("handles file read errors", async () => {
            fs.readFile.mockRejectedValue(new Error("File not found"));

            await request(app).get("/api/items/1").expect(500);
        });
    });

    describe("POST /api/items", () => {
        test("creates new item successfully", async () => {
            const newItem = {
                name: "New Product",
                category: "Test",
                price: 29.99,
            };

            const response = await request(app).post("/api/items").send(newItem).expect(201);

            expect(response.body).toMatchObject(newItem);
            expect(response.body).toHaveProperty("id");
            expect(typeof response.body.id).toBe("number");
            expect(fs.writeFile).toHaveBeenCalled();
        });

        test("validates required name field", async () => {
            const invalidItem = {
                category: "Test",
                price: 29.99,
            };

            const response = await request(app).post("/api/items").send(invalidItem).expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("Name is required");
        });

        test("validates name is non-empty string", async () => {
            const invalidItem = {
                name: "   ",
                category: "Test",
                price: 29.99,
            };

            const response = await request(app).post("/api/items").send(invalidItem).expect(400);

            expect(response.body.error).toContain("Name is required");
        });

        test("validates required category field", async () => {
            const invalidItem = {
                name: "Test Product",
                price: 29.99,
            };

            const response = await request(app).post("/api/items").send(invalidItem).expect(400);

            expect(response.body.error).toContain("Category is required");
        });

        test("validates price is non-negative number", async () => {
            const invalidItem = {
                name: "Test Product",
                category: "Test",
                price: -10,
            };

            const response = await request(app).post("/api/items").send(invalidItem).expect(400);

            expect(response.body.error).toContain("Price is required");
        });

        test("validates price is a number", async () => {
            const invalidItem = {
                name: "Test Product",
                category: "Test",
                price: "invalid",
            };

            const response = await request(app).post("/api/items").send(invalidItem).expect(400);

            expect(response.body.error).toContain("Price is required");
        });

        test("trims whitespace from name and category", async () => {
            const newItem = {
                name: "  Trimmed Product  ",
                category: "  Trimmed Category  ",
                price: 29.99,
            };

            const response = await request(app).post("/api/items").send(newItem).expect(201);

            expect(response.body.name).toBe("Trimmed Product");
            expect(response.body.category).toBe("Trimmed Category");
        });

        test("handles file write errors", async () => {
            fs.writeFile.mockRejectedValue(new Error("Write failed"));

            const newItem = {
                name: "Test Product",
                category: "Test",
                price: 29.99,
            };

            await request(app).post("/api/items").send(newItem).expect(500);
        });
    });

    describe("Edge Cases", () => {
        test("handles empty data file", async () => {
            fs.readFile.mockResolvedValue("[]");

            const response = await request(app).get("/api/items").expect(200);

            expect(response.body.items).toHaveLength(0);
            expect(response.body.pagination.totalItems).toBe(0);
        });

        test("handles malformed JSON", async () => {
            fs.readFile.mockResolvedValue("invalid json");

            await request(app).get("/api/items").expect(500);
        });

        test("search returns empty results when no matches", async () => {
            const response = await request(app).get("/api/items?q=nonexistent").expect(200);

            expect(response.body.items).toHaveLength(0);
            expect(response.body.pagination.totalItems).toBe(0);
        });

        test("pagination beyond available pages", async () => {
            const response = await request(app).get("/api/items?page=10&limit=2").expect(200);

            expect(response.body.items).toHaveLength(0);
            expect(response.body.pagination.page).toBe(10);
            expect(response.body.pagination.hasNext).toBe(false);
            expect(response.body.pagination.hasPrev).toBe(true);
        });

        test("handles negative page numbers", async () => {
            const response = await request(app).get("/api/items?page=-1").expect(200);

            expect(response.body.pagination.page).toBe(1);
        });

        test("handles non-numeric page values", async () => {
            const response = await request(app).get("/api/items?page=abc").expect(200);

            expect(response.body.pagination.page).toBe(1);
        });

        test("handles decimal page values", async () => {
            const response = await request(app).get("/api/items?page=2.7").expect(200);

            expect(response.body.pagination.page).toBe(2);
        });

        test("calculates totalPages correctly with different limits", async () => {
            // 5 items with limit 2 should give 3 pages
            const response = await request(app).get("/api/items?limit=2").expect(200);

            expect(response.body.pagination.totalPages).toBe(3);
            expect(response.body.pagination.totalItems).toBe(5);
        });

        test("last page contains remaining items", async () => {
            // Page 3 with limit 2 should have 1 item (5 total items)
            const response = await request(app).get("/api/items?page=3&limit=2").expect(200);

            expect(response.body.items).toHaveLength(1);
            expect(response.body.pagination.hasNext).toBe(false);
            expect(response.body.pagination.hasPrev).toBe(true);
        });

        test("middle page has correct navigation flags", async () => {
            const response = await request(app).get("/api/items?page=2&limit=2").expect(200);

            expect(response.body.pagination.hasNext).toBe(true);
            expect(response.body.pagination.hasPrev).toBe(true);
        });

        test("single page has no navigation", async () => {
            const response = await request(app).get("/api/items?limit=10").expect(200);

            expect(response.body.pagination.hasNext).toBe(false);
            expect(response.body.pagination.hasPrev).toBe(false);
            expect(response.body.pagination.totalPages).toBe(1);
        });
    });
});
