/**
 * Run with: npm run seed:admin
 *
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from .env, hashes the password
 * with bcrypt, and inserts/updates the admin row. The plaintext password
 * is never written to the database or logged.
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('[seedAdmin] ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [existing] = await pool.query('SELECT id FROM admins WHERE email = ? LIMIT 1', [email]);

  if (existing[0]) {
    await pool.query('UPDATE admins SET password_hash = ? WHERE email = ?', [passwordHash, email]);
    console.log(`[seedAdmin] Updated existing admin: ${email}`);
  } else {
    await pool.query('INSERT INTO admins (email, password_hash) VALUES (?, ?)', [email, passwordHash]);
    console.log(`[seedAdmin] Created admin: ${email}`);
  }

  console.log('[seedAdmin] IMPORTANT: change this password after first login in production.');
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('[seedAdmin] Failed:', err.message);
  process.exit(1);
});
