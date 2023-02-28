const express = require('express');
const { ensureLoggedIn } = require('connect-ensure-login');
const needle = require('needle');
// eslint-disable-next-line import/no-extraneous-dependencies
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

router.get('/availableunits', async (req, res) => {
  needle.get(
    `${baseLink}/unitsapi/openunits`,
    (error, response) => {
      if (error) {
        console.error(error);
      } else {
        const units = response.body;
        res.render(
          'availableUnits',
          {
            title: 'Admin Dashboard',
            units,
          },
        );
      }
    },
  );
});

/* Admin Dashboard. */
router.get(
  '/admin',
  ensureLoggedIn({ redirectTo: '/auth/login' }),
  async (req, res) => {
    if (req.user.isAdmin) {
      needle.get(
        `${baseLink}/dbapi/currentcustomers`,
        (error, response) => {
          if (error) {
            console.error(error);
          } else {
            const keys = Object.values(response.body);
            const values = Object.values(response.body);
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
