const express = require("express");
const router = express.Router();
const { getStatsService } = require("../services/statsService");

// GET /api/stats
router.get("/", (req, res, next) => {
    try {
        const statsService = getStatsService();
        const stats = statsService.getStats();
        res.json(stats);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
