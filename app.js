const express = require('express');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
// eslint-disable-next-line import/no-extraneous-dependencies
const flash = require('express-flash');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { engine } = require('express-handlebars');
const passport = require('passport');
const prisma = require('./lib/db');

const indexRouter = require('./routes/index');
const dashboardRouter = require('./routes/dashboards');
const authRouter = require('./routes/auth');
const validationRouter = require('./routes/validation');

const app = express();

// view engine setup
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
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
app.use('/dashboards', dashboardRouter);
app.use('/validation', validationRouter);

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
