const express = require('express');
// const passport = require('passport');

const router = express.Router();

/* Admin Dashboard. */
router.get(
  '/admin',
  //   passport.authenticate('magiclogin'),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => {
    console.log(`> adminDashboard: ${req.user.isAdmin}`);
    if (req.user.employee.isAdmin) {
      res.render('adminDashboard', { title: 'Admin Dashboard' });
    } else {
      res.redirect('/login');
    }
    res.redirect('/');
  },
);

/* Customer Dashboard. */
router.get(
  '/customer',
  //   passport.authenticate('magiclogin', { failureMessage: 'Please log in' }),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => {
    if (!req.user) {
      res.redirect('/login');
    } else {
      res.render('customerDashboard', { title: 'Customer Dashboard' });
    }
    res.redirect('/');
  },
);

/* Employee Dashboard. */
router.get(
  '/employee',
  //   passport.authenticate('magiclogin'),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => {
    if (req.user.givenName) {
      res.render('employeeDashboard', { title: 'Employee Dashboard' });
    } else {
      res.redirect('/login');
    }
    res.redirect('/');
  },
);

module.exports = router;
