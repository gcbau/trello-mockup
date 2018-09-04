var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var cors = require('cors');
var session = require('client-sessions');

var checkRouter = require('./routes/check');
var allRouter   = require('./routes/all');

var loginRouter = require('./routes/loginRoute');
var boardsRouter = require('./routes/boardsRoute');
var listsRouter = require('./routes/listsRoute');
var cardsRouter = require('./routes/cardsRoute');

// create app
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(cors());

app.use(session({
  cookieName: 'session',
  secret: 'random_string_goes_here',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

app.use(function(req, res, next) {
  console.log('MIDDLEWARE => ', req.session);
  // req.session.reset();
  if (req.session && req.session.user) {
    req.session.user = req.session.user;  //refresh the session value
    next();
  } else {
    next();
  }
});

app.use('/home', loginRouter);

app.use('*', checkRouter);
app.use('/', allRouter);

app.use('/:username/boards', boardsRouter);
app.use('/', listsRouter);
app.use('/', cardsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.log(err);
  // render the error page
  res.status(err.status || 500).json({
    error: err
  });
});

module.exports = app;