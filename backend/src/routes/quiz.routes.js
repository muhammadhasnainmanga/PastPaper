const router = require('express').Router();
const c = require('../controllers/quiz.controller.js');

router.get('/subjects', c.subjects);
router.get('/sets', c.sets);
router.get('/questions', c.questions);

module.exports = router;