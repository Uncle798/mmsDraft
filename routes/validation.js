const express = require('express');

const router = express.Router();
const needle = require('needle');
const { body, validationResult, checkSchema } = require('express-validator');
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

const contactInfoSchema = {
  addesss1: {
    in: ['body'],
    trim: true,
    escape: true,
    isString: true,
  },
  address2: {
    in: ['body'],
    trim: true,
    escape: true,
    isString: true,
    optional: { options: { nullable: true } },
  },
  address3: {
    in: ['body'],
    trim: true,
    escape: true,
    isString: true,
    optional: { options: { nullable: true } },
  },
  state: {
    in: ['body'],
    trim: true,
    escape: true,
    isString: true,
    toUpperCase: true,
    matches: stateCodes,
  },
  zipcode: {
    in: ['body'],
    trim: true,
    escape: true,
    isPostalCode: { options: 'US' },
    toString: true,
  },
  phone1: {
    in: ['body'],
    trim: true,
    escape: true,
    matches: phoneRegex,
    toString: true,
  },
  phone2: {
    in: ['body'],
    trim: true,
    escape: true,
    matches: phoneRegex,
    toString: true,
    optional: { options: { nullable: true } },
  },
};

/** Contact Info Form */
// router.post(
//   '/contactinfoform',
//   checkSchema(contactInfoSchema),
//   (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.error(errors.array());
//       res.render('login', {
//         title: 'Login to Moscow Ministorage',
//         errors: errors.array(),
//       });
//     } else {
//       needle.post(
//         '/api/user/contactInfo',
//         req.body,
//         (err, response) => {
//           res.json(response);
//           res.send();
//         },
//       );
//     }
//   },
// );

module.exports = router;
