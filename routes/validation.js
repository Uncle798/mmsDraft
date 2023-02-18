const express = require('express');

const router = express.Router();
const needle = require('needle');
const { body, validationResult } = require('express-validator');
const Joi = require('joi');
const prisma = require('../lib/db');
const { baseLink } = require('../lib/baseLink');
const { stateCodes, phoneRegex, zipcodeRegex } = require('../lib/validation');

const sendLinkUrl = `${baseLink}/auth/sendlink`;

/** Login Form  */

router.post(
  '/loginform',
  async (req, res, next) => {
    const keys = Object.keys(req.body);
    const { email } = req.body;
    const result = Joi.assert(email, Joi.string().email());
    console.log(`>>>>> validation loginForm: ${result}`);
    if (result) {
      console.error(result);
      res.render('login', {
        title: 'Login to Moscow Ministorage',
        result,
      });
    } else {
      const dbUser = await prisma.user.findUnique({ where: { email } });
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
        {
          json: true,
          port: process.env.BROWSER_SYNC_PORT,
        },
        (err, response) => {
          if (err) {
            console.error(err);
            res.set(err);
          }
          const keys = Object.keys(response.body)
          console.log(`>>>> needle.post response.body: ${keys}`);
          return res.render('loginSuccessfullEmailSent');
        },
      );
    }
  },
);

/** Name form  */
const userFirstTimeSchema = Joi.object({
  givenName: Joi.string().trim().alphanum(),
  familyName: Joi.string().trim().alphanum(),
});

router.post(
  '/userfirsttime',
  async (req, res, next) => {
    const {error, value} = userFirstTimeSchema.validate(req.body)
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
const contactInfoSchema = Joi.object({
  organizationName: Joi.string().trim(),
  address1: Joi.string().trim(),
  address2: Joi.string().trim().optional(),
  address3: Joi.string().trim().optional(),
  city: Joi.string().trim(),
  state: Joi.string().valid(JSON.stringify(stateCodes)),
  zip: Joi.string().regex(zipcodeRegex),
  phoneNum1: Joi.string().regex(phoneRegex),
  phoneNum2: Joi.string().regex(phoneRegex).optional()
});

router.post(
  '/contactinfoform',
  (req, res) => {
    const {errors, result} = contactInfoSchema.validate(req.body)
    if (!errors.isEmpty()) {
      console.error(errors.array());
      res.render('login', {
        title: 'Login to Moscow Ministorage',
        errors: errors.array(),
      });
    } else {
      needle.post(
        `${baseLink}/api/user/contactInfo`,
        req.body,
        {
          json: true,
          port: process.env.BROWSER_SYNC_PORT,
        },
        (err, response) => {
          res.json(response);
          res.send();
        },
      );
    }
  },
);

module.exports = router;
