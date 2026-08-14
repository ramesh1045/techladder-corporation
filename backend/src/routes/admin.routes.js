const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { uploadVideoFields } = require('../middleware/upload.middleware');
const {
  listAdminVideos,
  getAdminVideo,
  createVideo,
  updateVideo,
  deleteVideo,
  updateStatus,
  updateFeatured
} = require('../controllers/video.controller');

// Every route below requires a valid JWT — enforced here, not just in Angular.
router.use(requireAuth);

router.get('/videos', listAdminVideos);
router.get('/videos/:id', getAdminVideo);
router.post('/videos', uploadVideoFields, createVideo);
router.put('/videos/:id', uploadVideoFields, updateVideo);
router.delete('/videos/:id', deleteVideo);
router.patch('/videos/:id/status', updateStatus);
router.patch('/videos/:id/featured', updateFeatured);

module.exports = router;
