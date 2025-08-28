const sqlite3 = require("sqlite3").verbose();
const fs = require("fs").promises;
const path = require("path");

class DatabaseService {
    constructor(dbPath = "./data/items.db") {
        this.dbPath = dbPath;
        this.db = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Ensure data directory exists
            const dbDir = path.dirname(this.dbPath);
            await fs.mkdir(dbDir, { recursive: true });

            // Create/open database
            this.db = new sqlite3.Database(this.dbPath);

            // Create items table if it doesn't exist
            await this.createTables();

            // Check if database is empty and migrate data if needed
            const count = await this.getItemCount();
            if (count === 0) {
                await this.migrateFromJson();
            }

            this.isInitialized = true;
            console.log(`Database initialized with ${await this.getItemCount()} items`);
        } catch (error) {
            console.error("Database initialization failed:", error);
            throw error;
        }
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            this.db.run(
                `
                CREATE TABLE IF NOT EXISTS items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    category TEXT NOT NULL,
                    price REAL NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `,
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async getItemCount() {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT COUNT(*) as count FROM items", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }

    async migrateFromJson() {
        try {
            const jsonPath = path.join(__dirname, "../../../data/items.json");
            const jsonData = await fs.readFile(jsonPath, "utf8");
            const items = JSON.parse(jsonData);

            console.log(`Migrating ${items.length} items from JSON to SQLite...`);

            for (const item of items) {
                await this.insertItem({
                    name: item.name.trim().toLowerCase(),
                    category: item.category.trim().toLowerCase(),
                    price: item.price,
                });
            }

            console.log("Migration completed successfully");
        } catch (error) {
            console.error("Migration failed:", error);
            // Don't throw - it's okay if JSON file doesn't exist
        }
    }

    async insertItem(item) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO items (name, category, price) 
                VALUES (?, ?, ?)
            `);

            const name = item.name.trim().toLowerCase();
            const category = item.category.trim().toLowerCase();
            const price = item.price;

            stmt.run([name, category, price], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...item });
                }
            });

            stmt.finalize();
        });
    }

    async getAllItems(limit = null, offset = 0) {
        return new Promise((resolve, reject) => {
            let query = "SELECT * FROM items ORDER BY id";
            const params = [];

            if (limit) {
                query += " LIMIT ? OFFSET ?";
                params.push(limit, offset);
            }

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getItemById(id) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM items WHERE id = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async searchItems(query, limit = null, offset = 0) {
        return new Promise((resolve, reject) => {
            let sql = `
                SELECT * FROM items 
                WHERE name LIKE ? OR category LIKE ? 
                ORDER BY id
            `;
            const params = [`%${query}%`, `%${query}%`];

            if (limit) {
                sql += " LIMIT ? OFFSET ?";
                params.push(limit, offset);
            }

            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getSearchCount(query) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT COUNT(*) as count FROM items WHERE name LIKE ? OR category LIKE ?", [`%${query}%`, `%${query}%`], (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }

    async upsertItem(item) {
        const name = item.name.trim().toLowerCase();
        const category = item.category.trim().toLowerCase();
        const price = item.price;
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO items (name, category, price)
                VALUES (?, ?, ?)
                ON CONFLICT(name) DO UPDATE SET
                    category = excluded.category,
                    price = excluded.price,
                    updated_at = CURRENT_TIMESTAMP;
            `;
            this.db.run(query, [name, category, price], function (err) {
                if (err) return reject(err);
                resolve({ id: this.lastID, ...item });
            });
        });
    }

    async getStats() {
        if (!this.db) {
            throw new Error("Database not initialized");
        }

        const statsQuery = `
            SELECT
                COUNT(*) as totalItems,
                COUNT(DISTINCT category) as totalCategories,
                AVG(price) as averagePrice,
                MIN(price) as minPrice,
                MAX(price) as maxPrice
            FROM items;
        `;

        const categoryQuery = `
            SELECT LOWER(category) as category, COUNT(*) as count
            FROM items
            GROUP BY LOWER(category)
            ORDER BY count DESC;
        `;

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                let stats = {};
                this.db
                    .get(statsQuery, [], (err, row) => {
                        if (err) return reject(err);
                        stats = { ...stats, ...row };
                    })
                    .all(categoryQuery, [], (err, rows) => {
                        if (err) return reject(err);
                        stats.categoryBreakdown = rows.reduce((acc, row) => {
                            acc[row.category] = row.count;
                            return acc;
                        }, {});
                        stats.lastUpdated = new Date().toISOString();
                        resolve(stats);
                    });
            });
        });
    }

    async close() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) console.error("Error closing database:", err);
                    resolve();
                });
            });
        }
    }
}

module.exports = DatabaseService;
