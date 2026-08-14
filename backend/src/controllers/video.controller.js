const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { ApiError } = require('../middleware/error.middleware');
const { VIDEO_DIR, THUMB_DIR, MAX_VIDEO_BYTES, MAX_THUMB_BYTES } = require('../middleware/upload.middleware');

function mediaUrl(kind, filename) {
  if (!filename) return null;
  // Relative path only — Angular builds the absolute URL from environment.API_BASE_URL,
  // so we never bake localhost into stored data.
  return `/uploads/${kind}/${filename}`;
}

function toPublicShape(row) {
  return {
    id: row.id,
    title: row.title,
    clientName: row.client_name,
    description: row.description,
    category: row.category_name ? { id: row.category_id, name: row.category_name, slug: row.category_slug } : null,
    campaignType: row.campaign_type,
    videoUrl: mediaUrl('videos', row.video_filename),
    thumbnailUrl: mediaUrl('thumbnails', row.thumbnail_filename),
    featured: !!row.featured,
    createdAt: row.created_at
  };
}

function toAdminShape(row) {
  return {
    ...toPublicShape(row),
    status: row.status,
    updatedAt: row.updated_at
  };
}

const BASE_SELECT = `
  SELECT v.id, v.title, v.client_name, v.description, v.category_id, v.campaign_type,
         v.video_filename, v.thumbnail_filename, v.status, v.featured, v.created_at, v.updated_at,
         c.name AS category_name, c.slug AS category_slug
  FROM videos v
  LEFT JOIN categories c ON c.id = v.category_id
`;

// ---------------------------------------------------------------
// PUBLIC
// ---------------------------------------------------------------

async function listPublicVideos(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const offset = (page - 1) * limit;

    const where = ["v.status = 'published'"];
    const params = [];

    if (req.query.category) {
      where.push('c.slug = ?');
      params.push(req.query.category);
    }
    if (req.query.search) {
      where.push('(v.title LIKE ? OR v.client_name LIKE ? OR v.description LIKE ?)');
      const term = `%${req.query.search}%`;
      params.push(term, term, term);
    }
    if (req.query.featured === 'true') {
      where.push('v.featured = 1');
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;

    const [rows] = await pool.query(
      `${BASE_SELECT} ${whereClause} ORDER BY v.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM videos v LEFT JOIN categories c ON c.id = v.category_id ${whereClause}`,
      params
    );

    res.json({
      success: true,
      videos: rows.map(toPublicShape),
      pagination: {
        page,
        limit,
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getPublicVideo(req, res, next) {
  try {
    const [rows] = await pool.query(
      `${BASE_SELECT} WHERE v.id = ? AND v.status = 'published' LIMIT 1`,
      [req.params.id]
    );
    if (!rows[0]) throw new ApiError(404, 'Video not found');

    const [related] = await pool.query(
      `${BASE_SELECT} WHERE v.status = 'published' AND v.id != ? AND (v.category_id <=> ?) ORDER BY v.created_at DESC LIMIT 4`,
      [req.params.id, rows[0].category_id]
    );

    res.json({
      success: true,
      video: toPublicShape(rows[0]),
      related: related.map(toPublicShape)
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------
// ADMIN
// ---------------------------------------------------------------

async function listAdminVideos(req, res, next) {
  try {
    const where = [];
    const params = [];

    if (req.query.status) {
      where.push('v.status = ?');
      params.push(req.query.status);
    }
    if (req.query.category) {
      where.push('v.category_id = ?');
      params.push(req.query.category);
    }
    if (req.query.search) {
      where.push('(v.title LIKE ? OR v.client_name LIKE ?)');
      const term = `%${req.query.search}%`;
      params.push(term, term);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `${BASE_SELECT} ${whereClause} ORDER BY v.created_at DESC`,
      params
    );

    const [stats] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'published') AS published,
        SUM(status = 'draft') AS draft,
        SUM(featured = 1) AS featured
      FROM videos
    `);

    res.json({
      success: true,
      videos: rows.map(toAdminShape),
      stats: {
        total: Number(stats[0].total) || 0,
        published: Number(stats[0].published) || 0,
        draft: Number(stats[0].draft) || 0,
        featured: Number(stats[0].featured) || 0
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getAdminVideo(req, res, next) {
  try {
    const [rows] = await pool.query(`${BASE_SELECT} WHERE v.id = ? LIMIT 1`, [req.params.id]);
    if (!rows[0]) throw new ApiError(404, 'Video not found');
    res.json({ success: true, video: toAdminShape(rows[0]) });
  } catch (err) {
    next(err);
  }
}

function removeFileIfExists(dir, filename) {
  if (!filename) return;
  const filePath = path.join(dir, filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') console.error('[video.controller] failed to remove file:', filePath, err.message);
  });
}

async function createVideo(req, res, next) {
  const videoFile = req.files?.video?.[0];
  const thumbFile = req.files?.thumbnail?.[0];

  try {
    const { title, clientName, description, categoryId, campaignType, status, featured } = req.body;

    if (!title || !title.trim()) throw new ApiError(400, 'Title is required');
    if (!clientName || !clientName.trim()) throw new ApiError(400, 'Client name is required');
    if (!videoFile) throw new ApiError(400, 'Video file is required');
    if (videoFile.size > MAX_VIDEO_BYTES) throw new ApiError(400, 'Video file exceeds the maximum allowed size');
    if (thumbFile && thumbFile.size > MAX_THUMB_BYTES) throw new ApiError(400, 'Thumbnail exceeds the maximum allowed size');

    const [result] = await pool.query(
      `INSERT INTO videos
        (title, client_name, description, category_id, campaign_type,
         video_filename, video_url, thumbnail_filename, thumbnail_url, status, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        clientName.trim(),
        description || null,
        categoryId || null,
        campaignType || null,
        videoFile.filename,
        mediaUrl('videos', videoFile.filename),
        thumbFile ? thumbFile.filename : null,
        thumbFile ? mediaUrl('thumbnails', thumbFile.filename) : null,
        status === 'published' ? 'published' : 'draft',
        featured === 'true' || featured === true ? 1 : 0
      ]
    );

    const [rows] = await pool.query(`${BASE_SELECT} WHERE v.id = ?`, [result.insertId]);
    res.status(201).json({ success: true, video: toAdminShape(rows[0]) });
  } catch (err) {
    // Clean up any uploaded files if the DB insert failed
    if (videoFile) removeFileIfExists(VIDEO_DIR, videoFile.filename);
    if (thumbFile) removeFileIfExists(THUMB_DIR, thumbFile.filename);
    next(err);
  }
}

async function updateVideo(req, res, next) {
  const videoFile = req.files?.video?.[0];
  const thumbFile = req.files?.thumbnail?.[0];

  try {
    const { id } = req.params;
    const [existingRows] = await pool.query('SELECT * FROM videos WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) throw new ApiError(404, 'Video not found');

    if (videoFile && videoFile.size > MAX_VIDEO_BYTES) throw new ApiError(400, 'Video file exceeds the maximum allowed size');
    if (thumbFile && thumbFile.size > MAX_THUMB_BYTES) throw new ApiError(400, 'Thumbnail exceeds the maximum allowed size');

    const { title, clientName, description, categoryId, campaignType, status, featured } = req.body;

    const fields = {
      title: title !== undefined ? title.trim() : existing.title,
      client_name: clientName !== undefined ? clientName.trim() : existing.client_name,
      description: description !== undefined ? description : existing.description,
      category_id: categoryId !== undefined ? (categoryId || null) : existing.category_id,
      campaign_type: campaignType !== undefined ? campaignType : existing.campaign_type,
      status: status !== undefined ? (status === 'published' ? 'published' : 'draft') : existing.status,
      featured: featured !== undefined ? (featured === 'true' || featured === true ? 1 : 0) : existing.featured,
      video_filename: existing.video_filename,
      video_url: existing.video_url,
      thumbnail_filename: existing.thumbnail_filename,
      thumbnail_url: existing.thumbnail_url
    };

    if (videoFile) {
      fields.video_filename = videoFile.filename;
      fields.video_url = mediaUrl('videos', videoFile.filename);
    }
    if (thumbFile) {
      fields.thumbnail_filename = thumbFile.filename;
      fields.thumbnail_url = mediaUrl('thumbnails', thumbFile.filename);
    }

    await pool.query(
      `UPDATE videos SET
        title = ?, client_name = ?, description = ?, category_id = ?, campaign_type = ?,
        video_filename = ?, video_url = ?, thumbnail_filename = ?, thumbnail_url = ?,
        status = ?, featured = ?
       WHERE id = ?`,
      [
        fields.title, fields.client_name, fields.description, fields.category_id, fields.campaign_type,
        fields.video_filename, fields.video_url, fields.thumbnail_filename, fields.thumbnail_url,
        fields.status, fields.featured, id
      ]
    );

    // Remove old files only after successful update
    if (videoFile && existing.video_filename) removeFileIfExists(VIDEO_DIR, existing.video_filename);
    if (thumbFile && existing.thumbnail_filename) removeFileIfExists(THUMB_DIR, existing.thumbnail_filename);

    const [rows] = await pool.query(`${BASE_SELECT} WHERE v.id = ?`, [id]);
    res.json({ success: true, video: toAdminShape(rows[0]) });
  } catch (err) {
    if (videoFile) removeFileIfExists(VIDEO_DIR, videoFile.filename);
    if (thumbFile) removeFileIfExists(THUMB_DIR, thumbFile.filename);
    next(err);
  }
}

async function deleteVideo(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT video_filename, thumbnail_filename FROM videos WHERE id = ?', [id]);
    if (!rows[0]) throw new ApiError(404, 'Video not found');

    await pool.query('DELETE FROM videos WHERE id = ?', [id]);

    removeFileIfExists(VIDEO_DIR, rows[0].video_filename);
    removeFileIfExists(THUMB_DIR, rows[0].thumbnail_filename);

    res.json({ success: true, message: 'Video deleted' });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['draft', 'published'].includes(status)) throw new ApiError(400, "Status must be 'draft' or 'published'");

    const [result] = await pool.query('UPDATE videos SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) throw new ApiError(404, 'Video not found');

    res.json({ success: true, message: `Video marked as ${status}` });
  } catch (err) {
    next(err);
  }
}

async function updateFeatured(req, res, next) {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    const [result] = await pool.query('UPDATE videos SET featured = ? WHERE id = ?', [featured ? 1 : 0, id]);
    if (result.affectedRows === 0) throw new ApiError(404, 'Video not found');

    res.json({ success: true, message: featured ? 'Video featured' : 'Video unfeatured' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPublicVideos,
  getPublicVideo,
  listAdminVideos,
  getAdminVideo,
  createVideo,
  updateVideo,
  deleteVideo,
  updateStatus,
  updateFeatured
};
