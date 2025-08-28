const request = require("supertest");
const express = require("express");
const fs = require("fs");
const path = require("path");
const statsRouter = require("../stats");

// Mock fs module
jest.mock("fs");

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
    });

    describe("GET /api/stats", () => {
        test("returns correct stats for valid data", (done) => {
            fs.readFile.mockImplementation((path, callback) => {
                callback(null, JSON.stringify(mockData));
            });

            request(app)
                .get("/api/stats")
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res.body).toHaveProperty("total", 5);
                    expect(res.body).toHaveProperty("averagePrice");

                    // Calculate expected average: (999.99 + 12.50 + 5.99 + 699.00 + 149.99) / 5
                    const expectedAverage = (999.99 + 12.5 + 5.99 + 699.0 + 149.99) / 5;
                    expect(res.body.averagePrice).toBeCloseTo(expectedAverage, 2);

                    done();
                });
        });

        test("returns correct stats for single item", (done) => {
            const singleItem = [{ id: 1, name: "Single Item", category: "Test", price: 50.0 }];

            fs.readFile.mockImplementation((path, callback) => {
                callback(null, JSON.stringify(singleItem));
            });

            request(app)
                .get("/api/stats")
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res.body.total).toBe(1);
                    expect(res.body.averagePrice).toBe(50.0);

                    done();
                });
        });

        test("handles empty data array", async () => {
            fs.readFile.mockImplementation((path, callback) => {
                callback(null, JSON.stringify([]));
            });

            const response = await request(app).get("/api/stats").expect(200);

            expect(response.body.total).toBe(0);
            // When JSON.stringify encounters NaN, it converts it to null
            expect(response.body.averagePrice).toBe(null);
        });

        test("handles file read errors", (done) => {
            fs.readFile.mockImplementation((path, callback) => {
                callback(new Error("File not found"));
            });

            request(app).get("/api/stats").expect(500, done);
        });

        test("handles malformed JSON", (done) => {
            fs.readFile.mockImplementation((path, callback) => {
                callback(null, "invalid json");
            });

            request(app).get("/api/stats").expect(500, done);
        });

        test("calculates stats for items with zero prices", (done) => {
            const zeroData = [
                { id: 1, name: "Free Item", category: "Free", price: 0 },
                { id: 2, name: "Paid Item", category: "Paid", price: 100 },
            ];

            fs.readFile.mockImplementation((path, callback) => {
                callback(null, JSON.stringify(zeroData));
            });

            request(app)
                .get("/api/stats")
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res.body.total).toBe(2);
                    expect(res.body.averagePrice).toBe(50);

                    done();
                });
        });

        test("calculates stats for items with decimal prices", (done) => {
            const decimalData = [
                { id: 1, name: "Item 1", category: "Test", price: 10.33 },
                { id: 2, name: "Item 2", category: "Test", price: 20.67 },
            ];

            fs.readFile.mockImplementation((path, callback) => {
                callback(null, JSON.stringify(decimalData));
            });

            request(app)
                .get("/api/stats")
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res.body.total).toBe(2);
                    expect(res.body.averagePrice).toBeCloseTo(15.5, 2);

                    done();
                });
        });

        test("uses correct file path", (done) => {
            fs.readFile.mockImplementation((filePath, callback) => {
                expect(filePath).toContain("data/items.json");
                callback(null, JSON.stringify(mockData));
            });

            request(app).get("/api/stats").expect(200, done);
        });
    });
});
