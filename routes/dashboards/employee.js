const express = require('express');

const router = express.Router();
const passport = require('passport');

/* GET home page. */
router.get(
  '/',
  passport.authenticate(['magiclink', 'google'], { failureRedirect: '/auth/login' }),
  (req, res, next) => {
    res.render('employeeDashboard', { title: 'Employee Dashboard' });
  },
);

module.exports = router;
