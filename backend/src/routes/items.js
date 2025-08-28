const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Utility to read data asynchronously
async function readData() {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

// Utility to write data asynchronously
async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { limit = 10, page = 1, q } = req.query;
    let results = data;

    // Apply search filter first (optimized)
    if (q) {
      const searchTerm = q.toLowerCase();
      results = results.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(searchTerm);
        const categoryMatch = item.category.toLowerCase().includes(searchTerm);
        return nameMatch || categoryMatch;
      });
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Cap at 100
    const offset = (pageNum - 1) * limitNum;
    const totalItems = results.length;
    const totalPages = Math.ceil(totalItems / limitNum);

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limitNum);

    res.json({
      items: paginatedResults,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    const { name, category, price } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
    }
    
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({ error: 'Category is required and must be a non-empty string' });
    }
    
    if (price === undefined || price === null || typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Price is required and must be a non-negative number' });
    }

    const item = {
      id: Date.now(),
      name: name.trim(),
      category: category.trim(),
      price: Number(price)
    };

    const data = await readData();
    data.push(item);
    await writeData(data);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;