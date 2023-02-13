const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Moscow Ministorage' });
});

router.get('/userfirsttime', (req, res, next)=>{
  res.render('userFirstTime', {title: 'Please tell us a bit more about you'})
})

module.exports = router;
