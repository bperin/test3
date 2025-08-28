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

const mockData = [
    { id: 1, name: "Laptop", category: "Electronics", price: 999.99 },
    { id: 2, name: "Coffee Mug", category: "Kitchen", price: 12.5 },
    { id: 3, name: "Notebook", category: "Office", price: 5.99 },
];

describe("Items Routes Integration", () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use("/api/items", createItemsRouter(mockItemsService, mockStatsService));

        // Error handler
        app.use((err, req, res, next) => {
            res.status(err.status || 500).json({ error: err.message });
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/items", () => {
        test("calls services correctly and returns paginated results", async () => {
            const paginatedResults = {
                items: [mockData[0], null],
                pagination: {
                    page: 1,
                    limit: 10,
                    totalItems: 2,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                },
            };

            mockItemsService.paginateItems.mockResolvedValue(paginatedResults);

            const response = await request(app).get("/api/items?q=electronics&page=1&limit=10").expect(200);

            expect(mockItemsService.paginateItems).toHaveBeenCalledWith("electronics", "1", "10");
            expect(response.body).toEqual(paginatedResults);
        });

        test("handles service errors", async () => {
            mockItemsService.paginateItems.mockRejectedValue(new Error("Service error"));

            await request(app).get("/api/items").expect(500);
        });
    });

    describe("GET /api/items/:id", () => {
        test("calls getItemById and returns item", async () => {
            mockItemsService.getItemById.mockResolvedValue(mockData[0]);

            const response = await request(app).get("/api/items/1").expect(200);

            expect(mockItemsService.getItemById).toHaveBeenCalledWith("1");
            expect(response.body).toEqual(mockData[0]);
        });

        test("handles 404 errors from service", async () => {
            const error = new Error("Item not found");
            error.status = 404;
            mockItemsService.getItemById.mockRejectedValue(error);

            await request(app).get("/api/items/999").expect(404);
        });
    });

    describe("POST /api/items", () => {
        test("creates item and invalidates stats cache", async () => {
            const newItem = { name: "New Product", category: "Test", price: 29.99 };
            const createdItem = { id: 123, ...newItem };

            mockItemsService.createItem.mockResolvedValue(createdItem);
            mockStatsService.invalidateCache.mockResolvedValue();

            const response = await request(app).post("/api/items").send(newItem).expect(201);

            expect(mockItemsService.createItem).toHaveBeenCalledWith(newItem);
            expect(mockStatsService.invalidateCache).toHaveBeenCalled();
            expect(response.body).toEqual(createdItem);
        });

        test("handles validation errors from service", async () => {
            const error = new Error("Name is required");
            error.status = 400;
            mockItemsService.createItem.mockRejectedValue(error);

            const response = await request(app).post("/api/items").send({ category: "Test", price: 10 }).expect(400);

            expect(response.body).toEqual({ error: "Name is required" });
        });

        test("continues when stats cache invalidation fails", async () => {
            const newItem = { name: "New Product", category: "Test", price: 29.99 };
            const createdItem = { id: 123, ...newItem };

            mockItemsService.createItem.mockResolvedValue(createdItem);
            mockStatsService.invalidateCache.mockRejectedValue(new Error("Cache error"));

            const response = await request(app).post("/api/items").send(newItem).expect(201);

            expect(response.body).toEqual(createdItem);
        });

        test("handles service errors", async () => {
            mockItemsService.createItem.mockRejectedValue(new Error("Service error"));

            await request(app).post("/api/items").send({ name: "Test", category: "Test", price: 10 }).expect(500);
        });
    });
});
