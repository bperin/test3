const request = require("supertest");
const express = require("express");
const fs = require("fs");
const path = require("path");
const statsRouter = require("../stats");

// Mock fs module
jest.mock("fs");

// Mock the statsService
const mockStatsService = {
    getStats: jest.fn(),
    initialize: jest.fn(),
    refreshStats: jest.fn(),
    invalidateCache: jest.fn(),
};

jest.mock("../../services/statsService", () => ({
    getStatsService: () => mockStatsService,
    createStatsService: () => mockStatsService,
    __resetSingleton: jest.fn(),
}));

const app = express();
app.use("/api/stats", statsRouter);

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

describe("Stats API Routes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementation
        mockStatsService.getStats.mockReturnValue({
            total: 5,
            averagePrice: 373.494,
            lastUpdated: new Date().toISOString(),
        });
    });

    describe("GET /api/stats", () => {
        test("returns stats from service successfully", async () => {
            mockStatsService.getStats.mockReturnValue({
                total: 5,
                averagePrice: 373.494,
                lastUpdated: new Date().toISOString(),
            });

            const response = await request(app).get("/api/stats").expect(200);

            expect(response.body).toHaveProperty("total", 5);
            expect(response.body).toHaveProperty("averagePrice", 373.494);
            expect(response.body).toHaveProperty("lastUpdated");
            expect(mockStatsService.getStats).toHaveBeenCalled();
        });

        test("handles service errors with 500 status", async () => {
            mockStatsService.getStats.mockImplementation(() => {
                throw new Error("Service error");
            });

            const response = await request(app).get("/api/stats").expect(500);
            expect(response.body).toHaveProperty("error", "Service error");
        });
    });
});
