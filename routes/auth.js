var express = require('express');
var router = express.Router();
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth');
const MagicLoginStrategy = require('passport-magic-login')


/*Google Login Redirect*/
router.get('/login/federated/google', passport.authenticate('google'))

/* GET login page. */
router.get('/', function(req, res, next) {
  res.render('login', { title: 'Login to Moscow Ministorage' });
});

module.exports = router;
