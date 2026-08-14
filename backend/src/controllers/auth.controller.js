const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { ApiError } = require('../middleware/error.middleware');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const [rows] = await pool.query(
      'SELECT id, email, password_hash FROM admins WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );

    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      success: true,
      token,
      admin: { id: admin.id, email: admin.email }
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, created_at FROM admins WHERE id = ? LIMIT 1',
      [req.admin.id]
    );
    if (!rows[0]) throw new ApiError(404, 'Admin not found');
    res.json({ success: true, admin: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };
