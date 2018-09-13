var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var cors = require('cors');
var session = require('client-sessions');

var allRouter   = require('./routes/all');

var loginRouter    = require('./routes/login');
var boardsRouter   = require('./routes/board/');
var listsRouter    = require('./routes/list/');
var cardsRouter    = require('./routes/list/card');
var cardInfoRouter = require('./routes/list/card-info');
var navbarRouter   = require('./routes/search');
var teamsRouter    = require('./routes/team');

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

// CORS
app.use(cors());

// COOKIE
app.use(session({
  cookieName: 'session',
  secret: 'random_string_goes_here',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

// LOGIN
app.use('/home', loginRouter);

app.use(function(req, res, next) 
{ // check if user is logged in
  if (req.session && req.session.user) {
    req.session.user = req.session.user;  //refresh the session value
    next();
  } else {
    res.redirect('/home');
  }
});

// CONTENT
app.use('/', allRouter);
app.use('/:username/boards', boardsRouter);
app.use('/', listsRouter);
app.use('/', cardsRouter);
app.use('/', cardInfoRouter);
app.use('/', navbarRouter);
app.use('/', teamsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {

  console.log(err.status, err.message);
  // send error message
  res.status(err.status || 500).send(err.message);
});

module.exports = app;