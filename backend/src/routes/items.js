const express = require("express");

// Factory function to create router with injected services
function createItemsRouter(itemsService, statsService) {
    const router = express.Router();

    // GET /api/items
    router.get("/", async (req, res, next) => {
        try {
            const { limit = 10, page = 1, q } = req.query;

            // Use service to search items
            const results = await itemsService.searchItems(q);

            // Use service to paginate results
            const paginatedData = await itemsService.paginateItems(results, page, limit);

            res.json(paginatedData);
        } catch (err) {
            next(err);
        }
    });

    // GET /api/items/:id
    router.get("/:id", async (req, res, next) => {
        try {
            const item = await itemsService.getItemById(req.params.id);
            res.json(item);
        } catch (err) {
            next(err);
        }
    });

    // POST /api/items
    router.post("/", async (req, res, next) => {
        try {
            const item = await itemsService.createItem(req.body);

            // Invalidate stats cache after creating new item
            try {
                await statsService.invalidateCache();
            } catch (error) {
                console.warn("Failed to invalidate stats cache:", error.message);
            }

            res.status(201).json(item);
        } catch (err) {
            // Handle validation errors from service
            if (err.status === 400) {
                return res.status(400).json({ error: err.message });
            }
            next(err);
        }
    });

    return router;
}

module.exports = createItemsRouter;
