const express = require('express');
const passport = require('passport');

const router = express.Router();

/* Admin Dashboard. */
router.get(
  '/admindashboard',
  passport.authenticate('magiclogin'),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => {
    if (req.user.employee.isAdmin) {
      res.render('./dashboards/adminDashboard');
    } else {
      res.redirect('/login');
    }
    res.redirect('/');
  },
);

/* Customer Dashboard. */
router.get(
  '/customerdashboard',
  passport.authenticate('magiclogin'),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => {
    if (req.user.givenName) {
      res.render('./dashboards/customerDashboard', { title: 'Customer Dashboard' });
    } else {
      res.redirect('/login');
    }
    res.redirect('/');
  },
);

/* Employee Dashboard. */
router.get(
  '/',
  passport.authenticate('magiclogin'),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => {
    if (req.user.givenName) {
      res.render('./dashboards/employeeDashboard', { title: 'Employee Dashboard' });
    } else {
      res.redirect('/login');
    }
    res.redirect('/');
  },
);

module.exports = router;
