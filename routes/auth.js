/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').Strategy;
const MagicLoginStrategy = require('passport-magic-login');
const prisma = require('../lib/db');
/* Google Login Redirect */
router.get('/login/federated/google', passport.authenticate('google'));
router.get(
  '/oauth2/redirect/google',
  passport.authenticate('google', { failureRedirect: '/login', failureMessage: true }),
  (req, res) => {
    res.redirect('/');
  },
);

passport.use(new GoogleStrategy({
  consumerKey: process.env.GOOGLE_ID,
  consumerSecret: process.env.GOOGLE_SECRET,
  callbackURL: '/oauth/redirect/google',
  scope: ['profile'],
}, ((accessToken, refreshToken, profile, cb) => {
  try {
    let account = prisma.account.findFirst({
      where: {
        AND: [
          { providerId: 'https://accounts.google.com' },
          { providerAccountId: profile.id },
        ],
      },
      include: {
        user: {
          select: {
            givenName: true,
            familyName: true,
          },
        },
      },
    });
    if (account === null) {
      account = prisma.account.create({
        data: {
          providerId: 'https://accounts.google.com',
          providerAccountId: profile.id,
          user: {
            connectOrCreate: {
              where: {
                email: profile.email,
              },
              create: {
                data: {
                  email: profile.email,
                  emailVerified: new Date(Date.now()),
                },
              },
            },
          },
        },
      });
    }
    return (cb(null, account));
  } catch (error) {
    console.error(error);
    return cb(error, null);
  }
})));

/* GET login page. */
router.get('/', (req, res, next) => {
  res.render('login', { title: 'Login to Moscow Ministorage' });
});

module.exports = router;
