const { pool } = require('../config/database');
const { ApiError } = require('../middleware/error.middleware');

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function listCategories(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.slug, c.created_at,
              COUNT(v.id) AS video_count
       FROM categories c
       LEFT JOIN videos v ON v.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    res.json({ success: true, categories: rows });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) throw new ApiError(400, 'Category name is required');

    const slug = slugify(name);
    const [existing] = await pool.query(
      'SELECT id FROM categories WHERE name = ? OR slug = ? LIMIT 1',
      [name.trim(), slug]
    );
    if (existing[0]) throw new ApiError(409, 'A category with this name already exists');

    const [result] = await pool.query(
      'INSERT INTO categories (name, slug) VALUES (?, ?)',
      [name.trim(), slug]
    );

    res.status(201).json({ success: true, category: { id: result.insertId, name: name.trim(), slug } });
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) throw new ApiError(400, 'Category name is required');

    const slug = slugify(name);
    const [result] = await pool.query(
      'UPDATE categories SET name = ?, slug = ? WHERE id = ?',
      [name.trim(), slug, id]
    );
    if (result.affectedRows === 0) throw new ApiError(404, 'Category not found');

    res.json({ success: true, category: { id: Number(id), name: name.trim(), slug } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return next(new ApiError(409, 'A category with this name already exists'));
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) throw new ApiError(404, 'Category not found');
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
