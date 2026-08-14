const express = require('express');
const router = express.Router();
const { listPublicVideos, getPublicVideo } = require('../controllers/video.controller');
const { listCategories } = require('../controllers/category.controller');
const { submitEnquiry } = require('../controllers/contact.controller');

router.get('/videos', listPublicVideos);
router.get('/videos/:id', getPublicVideo);
router.get('/categories', listCategories);
router.post('/contact', submitEnquiry);

module.exports = router;
