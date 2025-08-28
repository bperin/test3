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
                    name TEXT NOT NULL,
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
                    name: item.name,
                    category: item.category,
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

            stmt.run([item.name, item.category, item.price], function (err) {
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

    async createItem(item) {
        const newItem = await this.insertItem(item);
        return newItem;
    }

    async getStats() {
        if (!this.db) {
            throw new Error("Database not initialized");
        }
        
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT 
                    COUNT(*) as total,
                    AVG(price) as averagePrice
                FROM items
            `, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        total: row.total,
                        averagePrice: row.averagePrice || 0,
                        lastUpdated: new Date().toISOString()
                    });
                }
            });
        });
    }

    async close() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) console.error('Error closing database:', err);
                    resolve();
                });
            });
        }
    }
}

module.exports = DatabaseService;
