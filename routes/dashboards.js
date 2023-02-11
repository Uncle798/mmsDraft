const express = require('express');
// const passport = require('passport');

const debug = require('debug')('mmsServer');

const router = express.Router();

/* Admin Dashboard. */
router.get(
  '/admin',
  //   passport.authenticate('magiclogin'),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => {
    debug(`> adminDashboard: ${req.user}`);
    if (req.user) {
      res.render('adminDashboard', { title: 'Admin Dashboard' });
    } else {
      res.redirect(401, '/auth/login');
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
      res.redirect('/auth/login');
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
    const givenName = req.user ?? false;
    debug(`> ${givenName}`);
    if (givenName) {
      res.render('employeeDashboard', { title: 'Employee Dashboard' });
    } else {
      res.redirect('/auth/login');
      res.end();
    }
    res.redirect('/');
  },
);

module.exports = router;
