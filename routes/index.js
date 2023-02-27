const express = require('express');
const { ensureLoggedIn } = require('connect-ensure-login');
const needle = require('needle');
const { faker } = require('@faker-js/faker');
const { baseLink } = require('../lib/baseLink');

const lorem = faker.lorem.paragraphs(5);

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Moscow Ministorage', lorem });
});

router.get(
  '/userfirsttime',
  ensureLoggedIn({ redirectTo: '/auth/login' }),
  (req, res) => {
    res.render('userFirstTime', { title: 'Please tell us a bit more about you' });
  },
);

router.get('/availableunits', (req, res) => {
  res.render('availableUnits', { title: 'Here\'s what\'s currently available' });
});

/* Admin Dashboard. */
router.get(
  '/admin',
  ensureLoggedIn({ redirectTo: '/auth/login' }),
  // eslint-disable-next-line no-unused-vars
  async (req, res) => {
    if (req.user.isAdmin) {
      needle.get(
        `${baseLink}/api/currentcustomers`,
        (error, response) => {
          if (error) {
            console.error(error);
          } else {
            const keys = Object.keys(response.body);
            const values = Object.values(response.body);
            console.log(`>>>> values: ${values}`);
            res.render(
              'adminDashboard',
              {
                title: 'Admin Dashboard',
                keys,
                values,
              },
            );
          }
        },
      );
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
  (req, res) => {
    if (req.user.isAdmin) {
      res.redirect('/admin');
    } else if (req.user.isEmployee) {
      res.redirect('/employee');
    } else {
      needle.request(
        'GET',
        `${baseLink}/api/user/currentinfo`,
        { data: req.user.id },
        {
          port: process.env.BROWSER_SYNC_PORT,
        },
        (error, response) => {
          if (error) {
            console.error(error);
          }
          const userInfo = response.body;
          console.log(`> userInfo ${userInfo}`);
          res.render('customerDashboard', { title: 'Customer Dashboard', userInfo });
        },
      );
    }
  },
);

/* Employee Dashboard. */
router.get(
  '/employee',
  ensureLoggedIn({ redirectTo: '/auth/login' }),
  // eslint-disable-next-line no-unused-vars
  (req, res) => {
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
