const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { createCategory, updateCategory, deleteCategory } = require('../controllers/category.controller');

// Category listing is public (see public.routes.js -> GET /api/public/categories).
// Creating/editing/deleting categories is admin-only.
router.use(requireAuth);

router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
