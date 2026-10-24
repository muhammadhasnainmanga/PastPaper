const router = require('express').Router();
const controller = require('../controllers/books.controller.js');

router.get('/', controller.list);
router.get('/:id/file', controller.open);
router.get('/:id/download', controller.download);
router.get('/:id/cover', controller.cover);

module.exports = router;