const express = require('express');
const passport = require('passport');

const router = express.Router();

/* GET home page. */
router.get(
  '/',
  passport.authenticate(['magiclink', 'google'], { failureRedirect: '/auth/login' }),
  (req, res, next) => {
    res.render('adminDashboard', { title: 'Admin Dashboard' });
  },
);

module.exports = router;
