/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').Strategy;
const MagicLoginStrategy = require('passport-magic-login').default;
const nodeMailer = require('nodemailer');
const { htmlToText } = require('nodemailer-html-to-text');
// const hbs = require('nodemailer-express-handlebars');
const prisma = require('../lib/db');

const transporter = nodeMailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});
// transporter.use('compile', hbs);
transporter.use('compile', htmlToText);

async function sendEmail(email, name, link) {
  const linkString = new String(link);
  const sendLinkUrl = new String(process.env.BASE_URL);
  const finalLink = sendLinkUrl.concat(linkString.substring(linkString.indexOf('?')));
  const magicLinkEmail = {
    from: process.env.SMTP_FROM,
    subject: 'Sign into Moscow Ministorage',
    to: email,
    html: `<p>Hello ${name} thanks for visitning Moscow Ministorage, please <br/>
      <a href=${finalLink}>Click Here to login</a></p>`,
  };
  const info = await transporter.sendMail(magicLinkEmail);
  console.log(`> sendMail info: ${info}`);
  return info;
}

passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    cb(null, { id: user.id, email: user.email });
  });
});

passport.deserializeUser((user, cb) => {
  process.nextTick(() => cb(null, user));
});

/* Magic Login Strategy */
const magicLogin = new MagicLoginStrategy({
  secret: process.env.MAGIC_LINK_SECRET,
  callbackURL: '/auth/magiclogin/callback',
  sendMagicLink: async (destination, href) => {
    try {
      await sendEmail(destination.email, destination.givenName, href);
    } catch (error) {
      console.error(error);
    }
  },
  verify: async (payload, callback) => {
    try {
      const dbUser = await prisma.user.upsert({
        where: {
          email: payload.destination,
        },
        update: {
          updatedAt: new Date(Date.now()),
        },
        create: {
          data: {
            email: payload.destination,
            emailVerified: new Date(Date.now()),
          },
        },
        include: {
          employee: {
            select: {
              userId: true,
              isAdmin: true,
            },
          },
        },
      });
      return callback(null, dbUser);
    } catch (error) {
      return callback(error);
    }
  },
});
passport.use(magicLogin);

router.post('/sendlink', magicLogin.send);
router.get('/magiclogin/callback', passport.authenticate('magiclogin'));
/* End */

/* Google Login Strategy */
router.get('/federated/google', passport.authenticate('google'));
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
/* End */

/* Logout Route */
router.post('/', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

/* GET login page. */
router.get('/login', (req, res, next) => {
  res.render('login', { title: 'Login to Moscow Ministorage' });
});

module.exports = router;
