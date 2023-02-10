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
transporter.use('compile', htmlToText());

async function sendEmail(email, name, link) {
  const magicLinkEmail = {
    from: process.env.SMTP_FROM,
    subject: 'Sign into Moscow Ministorage',
    to: email,
    html: `<p>Hello ${name} thanks for visitning Moscow Ministorage, please <br/>
      <a href=${link}>Click Here to login</a></p>`,
  };
  const info = await transporter.sendMail(magicLinkEmail);
  return info;
}

passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    console.log(`> serializeUser(user.givenName): ${user.givenName}`);
    cb(null, {
      id: user.id,
      email: user.email,
      givenName: user.givenName,
      employee: Boolean(user.employee.userId),
      isAdmin: user.employee.isAdmin,
    });
  });
});

passport.deserializeUser((user, cb) => {
  console.log(`> deSerializeUser(user.givenName): ${user.givenName}`);
  process.nextTick(() => cb(null, user));
});

/* Magic Login Strategy */
const magicLogin = new MagicLoginStrategy({
  secret: process.env.MAGIC_LINK_SECRET,
  callbackURL: '/auth/magiclogin/callback',
  sendMagicLink: async (destination, href) => {
    const linkString = String(href);
    const baseLinkString = String(process.env.BASE_URL);
    const finalLink = baseLinkString
      .concat('/auth/magiclogin/callback')
      .concat(linkString.substring(linkString.indexOf('?')));
    try {
      await sendEmail(destination.email, destination.givenName, finalLink);
    } catch (error) {
      console.error(error);
    }
  },
  verify: async (payload, callback) => {
    try {
      const dbUser = await prisma.user.upsert({
        where: {
          email: payload.destination.email,
        },
        update: {
          updatedAt: new Date(Date.now()),
        },
        create: {
          email: payload.destination.email,
          emailVerified: new Date(Date.now()),
        },
        select: {
          id: true,
          email: true,
          givenName: true,
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
router.get(
  '/magiclogin/callback',
  passport.authenticate('magiclogin', { failureRedirect: '/login', failureFlash: true, failureMessage: 'Magic Login Error' }),
  (req, res) => {
    const keys = Object.keys(req.user);
    console.log(`> auth.js magiclogin/callback Object.keys(req.user): ${keys}`);

    if (req.user.isAdmin) {
      res.redirect('/admindashboard');
    } else if (req.user.employee) {
      res.redirect('/employeedashboard');
    } else if (!req.user.givenName) {
      res.redirect('/userfirsttime');
    } else {
      res.redirect('/customerdashboard');
    }
    res.redirect('/');
  },
);
/* End */

/* Google Login Strategy */
router.get('/federated/google', passport.authenticate('google'));
router.get(
  '/oauth2/redirect/google',
  passport.authenticate('google', { failureRedirect: '/login', failureMessage: true }),
  (_req, res) => {
    res.redirect('/');
  },
);
passport.use(new GoogleStrategy({
  consumerKey: process.env.GOOGLE_ID,
  consumerSecret: process.env.GOOGLE_SECRET,
  callbackURL: '/oauth/redirect/google',
  scope: ['profile'],
}, ((_accessToken, _refreshToken, profile, cb) => {
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
  // eslint-disable-next-line consistent-return
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

/* GET login page. */
router.get('/login', (req, res) => {
  const keys = Object.values(req.session.flash);
  console.log(`> Object.values(req.session.flash): ${keys}`);
  res.render('login', { title: 'Login to Moscow Ministorage' });
});

module.exports = router;
