const express = require("express");
const path = require("path");
const morgan = require("morgan");
const createItemsRouter = require("./routes/items");
const statsRouter = require("./routes/stats");
const cors = require("cors");
const { getCookie, notFound } = require("./middleware/errorHandler");
const { createStatsService } = require("./services/statsService");
const { createItemsService } = require("./services/itemsService");

const app = express();
const port = process.env.PORT || 3001;

// Initialize services with data path
const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, "../../data/items.json");
const itemsService = createItemsService(DATA_PATH);
const statsService = createStatsService(itemsService);

app.use(cors({ origin: "http://localhost:3000" }));
// Basic middleware
app.use(express.json());
app.use(morgan("dev"));

// Routes with injected services
app.use("/api/items", createItemsRouter(itemsService, statsService));
app.use("/api/stats", statsRouter);

// Not Found
app.use("*", notFound);

getCookie();

// Initialize services on startup
async function startServer() {
    try {
        await statsService.initialize();
        await itemsService.initialize();
        app.listen(port, () => console.log("Backend running on http://localhost:" + port));
    } catch (error) {
        console.error("Failed to initialize server:", error);
        process.exit(1);
    }
}

startServer();
