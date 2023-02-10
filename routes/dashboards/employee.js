const express = require('express');

const router = express.Router();
const passport = require('passport');

/* GET home page. */
router.get(
  '/',
  passport.authenticate(
    'magiclogin',
    { failureRedirect: '/auth/login', failureFlash: true, failureMessage: 'Please login' },
  ),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => {
    res.render('employeeDashboard', { title: 'Employee Dashboard' });
  },
);

module.exports = router;
