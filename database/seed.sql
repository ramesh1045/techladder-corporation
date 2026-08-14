-- ============================================================
-- TechLadder Corporation - Seed Data
-- Run AFTER schema.sql
-- NOTE: Admin account is NOT seeded here (never store plaintext
-- passwords in SQL files). Run `npm run seed:admin` in /backend
-- instead, which reads ADMIN_EMAIL / ADMIN_PASSWORD from .env,
-- hashes it with bcrypt, and inserts it safely.
-- ============================================================

USE techladder_corporation;

INSERT INTO categories (name, slug) VALUES
  ('Brand Films', 'brand-films'),
  ('Social Media Ads', 'social-media-ads'),
  ('Product Launch', 'product-launch'),
  ('Digital Campaigns', 'digital-campaigns'),
  ('Corporate', 'corporate')
ON DUPLICATE KEY UPDATE name = VALUES(name);
