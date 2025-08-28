const request = require("supertest");
const express = require("express");
const createItemsRouter = require("../items");
const fs = require("fs").promises;

// Mock fs module
jest.mock("fs", () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
    },
}));

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
        // Default successful mocks - individual tests will override as needed
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
        mockItemsService.getItemById.mockResolvedValue(mockData[0]);
        mockItemsService.createItem.mockResolvedValue({ id: 6, name: "Test", category: "Test", price: 29.99 });
        mockStatsService.invalidateCache.mockResolvedValue();
    });

    describe("GET /api/items", () => {
        test("returns all items with default pagination", async () => {
            const paginatedResult = {
                items: mockData,
                pagination: {
                    page: 1,
                    limit: 10,
                    totalItems: 5,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                },
            };
            mockItemsService.paginateItems.mockResolvedValue(paginatedResult);

            const response = await request(app).get("/api/items").expect(200);

            expect(response.body).toEqual(paginatedResult);
            expect(mockItemsService.paginateItems).toHaveBeenCalledWith(undefined, 1, 10);
        });

        test("applies pagination correctly", async () => {
            const paginatedResult = {
                items: mockData.slice(0, 2),
                pagination: {
                    page: 1,
                    limit: 2,
                    totalItems: 5,
                    totalPages: 3,
                    hasNext: true,
                    hasPrev: false,
                },
            };
            mockItemsService.paginateItems.mockResolvedValue(paginatedResult);

            const response = await request(app).get("/api/items?page=1&limit=2").expect(200);

            expect(response.body.items).toHaveLength(2);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(2);
            expect(mockItemsService.paginateItems).toHaveBeenCalledWith(undefined, "1", "2");
        });

        test("handles search query correctly", async () => {
            const paginatedResult = {
                items: [mockData[0], mockData[3]],
                pagination: {
                    page: 1,
                    limit: 10,
                    totalItems: 2,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                },
            };
            mockItemsService.paginateItems.mockResolvedValue(paginatedResult);

            const response = await request(app).get("/api/items?q=electronics").expect(200);

            expect(response.body.items).toHaveLength(2);
            expect(mockItemsService.paginateItems).toHaveBeenCalledWith("electronics", 1, 10);
        });

        test("search is case insensitive", async () => {
            const paginatedResult = {
                items: [mockData[0], mockData[3]],
                pagination: {
                    page: 1,
                    limit: 10,
                    totalItems: 2,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                },
            };
            mockItemsService.paginateItems.mockResolvedValue(paginatedResult);

            const response = await request(app).get("/api/items?q=ELECTRONICS").expect(200);

            expect(response.body.items).toHaveLength(2);
            expect(mockItemsService.paginateItems).toHaveBeenCalledWith("ELECTRONICS", 1, 10);
        });


        test("handles service errors", async () => {
            mockItemsService.paginateItems.mockRejectedValue(new Error("Service error"));

            await request(app).get("/api/items").expect(500);
        });
    });

    describe("GET /api/items/:id", () => {
        test("returns specific item by id", async () => {
            const response = await request(app).get("/api/items/1").expect(200);

            expect(response.body).toEqual(mockData[0]);
        });

        test("returns 404 for non-existent item", async () => {
            mockItemsService.getItemById.mockRejectedValue({
                status: 404,
                message: "Item not found",
            });

            const response = await request(app).get("/api/items/999").expect(404);

            expect(response.body).toHaveProperty("error", "Item not found");
        });

        test("handles service errors", async () => {
            mockItemsService.getItemById.mockRejectedValue(new Error("Service error"));

            await request(app).get("/api/items/1").expect(500);
        });
    });

    describe("POST /api/items", () => {
        test("creates new item successfully", async () => {
            const newItem = {
                name: "Test Product",
                category: "Test",
                price: 29.99,
            };

            const createdItem = {
                id: 6,
                ...newItem,
            };

            mockItemsService.createItem.mockResolvedValue(createdItem);

            const response = await request(app).post("/api/items").send(newItem).expect(201);

            expect(response.body).toMatchObject(newItem);
            expect(response.body).toHaveProperty("id");
            expect(typeof response.body.id).toBe("number");
        });

        test("handles validation errors from service", async () => {
            const invalidItem = {
                name: "",
                category: "Test",
                price: 29.99,
            };

            mockItemsService.createItem.mockRejectedValue({
                status: 400,
                message: "Name is required and must be a non-empty string",
            });

            const response = await request(app).post("/api/items").send(invalidItem).expect(400);

            expect(response.body.error).toContain("Name is required");
        });

        test("handles service errors", async () => {
            const newItem = {
                name: "Test Product",
                category: "Test",
                price: 29.99,
            };

            mockItemsService.createItem.mockRejectedValue(new Error("Service error"));

            await request(app).post("/api/items").send(newItem).expect(500);
        });
    });

});
