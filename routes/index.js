const express = require('express');
const { ensureLoggedIn } = require('connect-ensure-login');

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
  ensureLoggedIn({ redirectTo: '/auth/login' }),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => {
    if (req.user.isAdmin) {
      res.render('adminDashboard', { title: 'Admin Dashboard' });
    } else {
      res.redirect('/customer');
    }
  },
);

/* Customer Dashboard. */
router.get(
  '/customer',
  ensureLoggedIn({ redirectTo: '/auth/login' }),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => {
    if (req.user.isAdmin) {
      res.redirect('/admin');
    } else if (req.user.isEmployee) {
      res.redirect('/employee');
    } else {
      res.render('customerDashboard', { title: 'Customer Dashboard' });
    }
  },
);

/* Employee Dashboard. */
router.get(
  '/employee',
  ensureLoggedIn({ redirectTo: '/auth/login' }),
  // eslint-disable-next-line no-unused-vars
  (req, res, next) => {
    if (req.user.isAdmin) {
      res.redirect('/admin');
    } else if (req.user.isEmployee) {
      res.render('employeeDashboard', { title: 'Employee Dashboard' });
    } else {
      res.redirect('/customer');
    }
  },
);

module.exports = router;
