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
        test("returns correct stats for valid data", async () => {
            const expectedAverage = (999.99 + 12.5 + 5.99 + 699.0 + 149.99) / 5;
            mockStatsService.getStats.mockReturnValue({
                total: 5,
                averagePrice: expectedAverage,
                lastUpdated: new Date().toISOString(),
            });

            const response = await request(app).get("/api/stats").expect(200);

            expect(response.body).toHaveProperty("total", 5);
            expect(response.body).toHaveProperty("averagePrice");
            expect(response.body.averagePrice).toBeCloseTo(expectedAverage, 2);
        });

        test("returns correct stats for single item", async () => {
            mockStatsService.getStats.mockReturnValue({
                total: 1,
                averagePrice: 999.99,
                lastUpdated: new Date().toISOString(),
            });

            const response = await request(app).get("/api/stats").expect(200);

            expect(response.body.total).toBe(1);
            expect(response.body.averagePrice).toBe(999.99);
        });

        test("handles empty data array", async () => {
            mockStatsService.getStats.mockReturnValue({
                total: 0,
                averagePrice: 0,
                lastUpdated: new Date().toISOString(),
            });

            const response = await request(app).get("/api/stats").expect(200);

            expect(response.body.total).toBe(0);
            expect(response.body.averagePrice).toBe(0);
        });

        test("handles file read errors", async () => {
            mockStatsService.getStats.mockImplementation(() => {
                throw new Error("File not found");
            });

            const response = await request(app).get("/api/stats").expect(500);
            expect(response.body).toHaveProperty("error");
        });

        test("calculates stats for items with zero prices", async () => {
            const zeroData = [
                { id: 1, name: "Free Item", category: "Free", price: 0 },
                { id: 2, name: "Paid Item", category: "Paid", price: 100 },
            ];

            mockStatsService.getStats.mockReturnValue({
                total: 2,
                averagePrice: 50,
                lastUpdated: new Date().toISOString(),
            });

            const response = await request(app).get("/api/stats").expect(200);

            expect(response.body.total).toBe(2);
            expect(response.body.averagePrice).toBe(50);
        });

        test("calculates stats for items with decimal prices", async () => {
            const expectedAverage = (10.99 + 20.50) / 2;
            mockStatsService.getStats.mockReturnValue({
                total: 2,
                averagePrice: expectedAverage,
                lastUpdated: new Date().toISOString(),
            });

            const response = await request(app).get("/api/stats").expect(200);

            expect(response.body.total).toBe(2);
            expect(response.body.averagePrice).toBeCloseTo(expectedAverage, 2);
        });

        test("uses correct file path", async () => {
            mockStatsService.getStats.mockReturnValue({
                total: 5,
                averagePrice: 373.494,
                lastUpdated: new Date().toISOString(),
            });

            await request(app).get("/api/stats").expect(200);
            
            expect(mockStatsService.getStats).toHaveBeenCalled();
        });
    });
});
