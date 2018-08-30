var express = require('express');
var router = express.Router();
var status = require('http-status');
var createError = require('http-errors');

var db = require('../models/index');

/** render login page */
router.get('/', function(req, res) {
  res.render('login', {});
});

/* log in */
router.post('/login', function(req, res, next) {
  let email = req.body.email;
  let pw = req.body.pw;

  if (email === undefined || email === '') {
    next(createError(401));
    return;
  }
  if (pw    === undefined || pw    === '') {
    next(createError(401));
    return;
  }

  let checkQuery = `SELECT * FROM "users" WHERE email=:email`;
  db.sequelize.query(checkQuery, { replacements:{email:email} ,type:db.sequelize.QueryTypes.SELECT }).then(sqlResponse => {
    if (0 >= sqlResponse.length) {
      next(createError(401));
      return;
    }
    if (sqlResponse[0].password !== pw) {
      next(createError(403));
      return;
    }

    // set session user
    delete sqlResponse[0].password;
    req.session.user = sqlResponse[0];
    // send OK response
    res.status(200).json(req.session.user);
  });
});


/** sign up */
router.post('/signup', function(req, res, next) {
  let first = req.body.first;
  let last  = req.body.last;
  let email = req.body.email;
  let pw    = req.body.pw;

  if (first === undefined || first === '') {
    next(createError(401));
    return;
  }
  if (last  === undefined || last  === '') {
    next(createError(401));
    return;
  }
  if (email === undefined || email === '') {
    next(createError(401));
    return;
  }
  if (pw    === undefined || pw    === '') {
    next(createError(401));
    return;
  }

  let checkQuery = `
    SELECT * 
    FROM users 
    WHERE email = '${email}'`;
  
  db.sequelize.query(checkQuery, { type: db.sequelize.QueryTypes.SELECT }).then(sqlResponse => {
    if (0 < sqlResponse.length) {
      next(createError(422, 'Email is already taken.'));
      return;
    }

    let insertQuery = `INSERT INTO users values (DEFAULT, '${email}', '${pw}', '${first}', '${last}') RETURNING *`;
    db.sequelize.query(insertQuery, { 
      type: db.sequelize.QueryTypes.INSERT 
    })
    .then(sqlResponse => {
      let data = sqlResponse[0][0];
      delete data.password;
      res.status(200).json(data);
    });
  });
})

module.exports = router;
