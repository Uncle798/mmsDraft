const express = require('express');
const ensureLogin = require('connect-ensure-login').ensureLoggedIn;

const router = express.Router();

/* Admin Dashboard. */
router.get(
  '/admin',
  ensureLogin({ redirectTo: '/auth/login' }),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => res.render('adminDashboard', { title: 'Admin Dashboard' }),
);

/* Customer Dashboard. */
router.get(
  '/customer',
  ensureLogin({ redirectTo: '/auth/login' }),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => res.render('customerDashboard', { title: 'Customer Dashboard' }),
);

/* Employee Dashboard. */
router.get(
  '/employee',
  ensureLogin({ redirectTo: '/auth/login' }),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => res.render('employeeDashboard', { title: 'Employee Dashboard' }),
);

module.exports = router;
