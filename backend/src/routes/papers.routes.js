const router = require('express').Router();
const controller = require('../controllers/papers.controller.js');

router.get('/', controller.list);
router.get('/zip', controller.zip); //for the whole download
router.get('/:id/file', controller.open); //for viewing
router.get('/:id/download', controller.download); //for downloading

module.exports = router;