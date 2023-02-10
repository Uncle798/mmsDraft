const express = require('express');
// const passport = require('passport');

const router = express.Router();

/* GET home page. */
router.get(
  '/',
  // passport.authenticate(
  //   'magiclogin',
  //   { failureRedirect: '/auth/login', failureFlash: true, failureMessage: 'Please login' },
  // ),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => {
    res.render('adminDashboard', { title: 'Admin Dashboard' });
  },
);

module.exports = router;
