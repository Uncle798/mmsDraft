const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Moscow Ministorage' });
});

router.get('/userfirsttime', (req, res, next) => {
  res.render('userFirstTime', { title: 'Please tell us a bit more about you' });
});

router.get('/availableunits', (req, res, next) => {
  res.render('availableUnits', { title: 'Here\'s what\'s currently available' });
});
/* Admin Dashboard. */
router.get(
  '/admin',
  // ensureLogin({ redirectTo: '/auth/login' }),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => res.render('adminDashboard', { title: 'Admin Dashboard' }),
);

/* Customer Dashboard. */
router.get(
  '/customer',
  // ensureLogin({ redirectTo: '/auth/login' }),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => res.render('customerDashboard', { title: 'Customer Dashboard' }),
);

/* Employee Dashboard. */
router.get(
  '/employee',
  // ensureLogin({ redirectTo: '/auth/login' }),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => res.render('employeeDashboard', { title: 'Employee Dashboard' }),
);

module.exports = router;
