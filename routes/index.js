const express = require('express');
const { ensureLoggedIn } = require('connect-ensure-login');
const needle = require('needle');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Moscow Ministorage' });
});

router.get(
  '/userfirsttime',
  ensureLoggedIn({ redirectTo: '/auth/login' }),
  (req, res, next) => {
    res.render('userFirstTime', { title: 'Please tell us a bit more about you' });
  },
);

router.get('/availableunits', (req, res, next) => {
  res.render('availableUnits', { title: 'Here\'s what\'s currently available' });
});

/* Admin Dashboard. */
router.get(
  '/admin',
  ensureLoggedIn({ redirectTo: '/auth/login' }),
  // eslint-disable-next-line no-unused-vars
  async (req, res, next) => {
    if (req.user.isAdmin) {
      let keys = {};
      let values = {};
      needle.get(
        'http://localhost:3002/api/currentcustomers',
        { port: 3002, localPort: 3000 },
        (err, response) => {
          if (err) {
            console.error(err);
          }
          keys = Object.keys(response.body);
          values = Object.values(response.body)
          console.log(`> ${values}`);
        },
      );
      res.render('adminDashboard', {
        title: 'Admin Dashboard',
        keys,
        values,
      });
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
