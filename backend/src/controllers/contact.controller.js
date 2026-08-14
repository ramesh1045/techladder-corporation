const { pool } = require('../config/database');
const { ApiError } = require('../middleware/error.middleware');

async function submitEnquiry(req, res, next) {
  try {
    const { name, companyName, phone, email, service, message } = req.body;

    if (!name || !name.trim()) throw new ApiError(400, 'Name is required');
    if (!email || !email.trim()) throw new ApiError(400, 'Email is required');
    if (!message || !message.trim()) throw new ApiError(400, 'Message is required');

    await pool.query(
      `INSERT INTO contact_enquiries (name, company_name, phone, email, service, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), companyName || null, phone || null, email.trim(), service || null, message.trim()]
    );

    res.status(201).json({ success: true, message: 'Thanks — we received your enquiry and will be in touch soon.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitEnquiry };
