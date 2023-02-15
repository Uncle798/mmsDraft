const express = require('express');

const router = express.Router();
const needle = require('needle');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/db');
const { stateCodes, phoneRegex } = require('../lib/validation');

const sendLinkUrl = `${process.env.BASE_URL}/auth/sendlink`;

/** Login Form  */
router.post(
  '/loginform',
  body('email', 'Email required').trim().isEmail().escape(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error(errors.array());
      // res.render('login', {
      //   title: 'Login to Moscow Ministorage',
      //   errors: errors.array(),
      // });
    } else {
      const dbUser = await prisma.user.findUnique({
        where: {
          email: req.body.email,
        },
      });
      let givenName = '';
      if (!dbUser) {
        givenName = 'Guest';
      } else {
        givenName = dbUser.givenName;
      }
      needle.post(
        sendLinkUrl,
        {
          destination: {
            email: req.body.email,
            givenName,
          },
        },
        { json: true },
        (err, response) => {
          if (err) {
            console.error(err);
            res.set(err);
            res.send();
          }
          if (response.body.success === true) {
            return res.render('loginSuccessfullEmailSent');
          }
        },
      );
    }
  },
);

/** Name form  */
router.post(
  '/userfirsttime',
  body(['givenName, familyName']).trim().escape().isAlpha(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error(errors.array());
      res.render('/userFirstTime', {
        errors: errors.array(),
      });
      return res.end();
    }
    try {
      prisma.user.update({
        where: {
          email: req.user.email,
        },
        data: {
          givenName: req.body.givenName,
          familyName: req.body.familyName,
        },
        select: {
          email: true,
          givenName: true,
        },
      });
      req.user.givenName = req.body.givenName;
      res.redirect('/availableunits');
      return res.end();
    } catch (error) {
      console.log(error);
    }
  },
);

/** Contact Info Form */
router.post(
  '/contactinfoform',
  body(['address1, city']).trim().escape().isString()
    .isAlphanumeric(),
  body(['address2, address3']).trim().escape().isString()
    .isAlphanumeric()
    .optional(),
  body(['state']).trim().escape().isString()
    .isAlphanumeric()
    .toUpperCase()
    .matches(stateCodes),
  body(['zipcode']).trim().escape()
    .isPostalCode('US')
    .toString(),
  body(['phone2']).trim().escape()
    .matches(phoneRegex)
    .toString(),
  body(['phone2']).trim().escape()
    .matches(phoneRegex)
    .optional()
    .toString(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error(errors.array());
      // res.render('login', {
      //   title: 'Login to Moscow Ministorage',
      //   errors: errors.array(),
      // });
    } else {
      needle.post(
        '/api/user/contactInfo',
        req.body,
        (err, response) => {
          res.json(response);
          res.send();
        },
      );
    }
  },
);

module.exports = router;
