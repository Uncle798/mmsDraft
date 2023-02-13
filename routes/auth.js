/* eslint-disable linebreak-style */
const express = require('express');

const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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
  const keys = Object.keys(user.user);
  console.log(`user keys: ${keys}`);
  process.nextTick(() => {
    let employee = false;
    let isAdmin = false;
    if (user.employee !== null) {
      employee = true;
      isAdmin = user.employee.isAdmin !== null;
    }
    const givenName = user.givenName !== null;
    cb(null, {
      id: user.id,
      email: user.email,
      givenName,
      employee,
      isAdmin,
    });
  });
});

passport.deserializeUser((user, cb) => {
  process.nextTick(() => cb(null, user));
});

function redirectUser(user) {

}

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
    if (req.user.isAdmin) {
      res.redirect('/dashboards/admin');
    } else if (req.user.employee) {
      res.redirect('/dashboards/employee');
    } else if (!req.user.givenName) {
      res.redirect('/userfirsttime');
    } else {
      res.redirect('/dashboards/customer');
    }
    res.redirect('/');
  },
);
/* End */

/* Google Login Strategy */
router.get('/federated/google', passport.authenticate('google', { scope: ['profile', 'email'] }), (req, res) => {
});
router.get(
  '/oauth2/redirect/google',
  passport.authenticate('google', { failureRedirect: '/login', failureMessage: true }),
  (req, res) => {
    res.redirect('/');
  },
);
passport.use(new GoogleStrategy({
  clientID: String(process.env.GOOGLE_ID),
  clientSecret: String(process.env.GOOGLE_SECRET),
  callbackURL: 'http://localhost:3000/auth/oauth2/redirect/google',
  passReqToCallback: true,
}, async (request, accessToken, refreshToken, profile, cb) => {
  const { emails } = profile;
  console.log(`> Google Strtegy emails: ${emails[0].value}`);
  try {
    let account = await prisma.account.findFirst({
      where: {
        AND: [
          { providerId: profile.provider },
          { providerAccountId: profile.id },
        ],
      },
      include: {
        user: {
          select: {
            givenName: true,
            familyName: true,
            email: true,
            employee: {
              select: {
                userId: true,
                isAdmin: true,
              },
            },
          },
        },
      },
    });
    if (account === null) {
      account = await prisma.account.create({
        data: {
          providerId: profile.provider,
          providerAccountId: profile.id,
          accessToken: String(accessToken),
          refreshToken: String(refreshToken),
          scope: 'profile email',
          user: {
            connectOrCreate: {
              where: {
                email: emails[0].value,
              },
              create: {
                email: emails[0].value,
                emailVerified: new Date(Date.now()),
              },
            },
          },
        },
      });
    }
    return cb(null, account);
  } catch (error) {
    console.error(error);
    return cb(error, null);
  }
}));
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
  res.render('login', { title: 'Login to Moscow Ministorage' });
});

module.exports = router;
exports.passport = passport;
