const express = require('express');

const router = express.Router();

router.get('/hello', (req, res, next) => {
  res.render('index', { title: '/user/hello' });
})

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Users' });
});

module.exports = router;
