const express = require('express');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const flash = require('express-flash');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const passport = require('passport');
const prisma = require('./lib/db');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const validationRouter = require('./routes/validation');
const customerApiRouter = require('./routes/customerApi');
const unitsApi = require('./routes/unitsApi');

const app = express();

// view engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new PrismaSessionStore(
    prisma,
    {
      checkPeriod: 2 * 60 * 1000, // ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    },
  ),
}));
app.use(passport.session());
app.use(flash());

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/validation', validationRouter);
app.use('/customerapi', customerApiRouter);
app.user('/unitsapi', unitsApi);

// app.use((req, res, next) => {
//   res.write({ baseLink: `${process.env.BASE_URL}${process.env.BROWSER_SYNC_PORT}` });
//   next();
// });

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
