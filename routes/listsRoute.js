var express = require('express');
var router = express.Router();
var db = require('../models/index');

router.get('/b/:bid/:bname', function(req, res) {
    console.log(' ');
    console.log(req.params);
    console.log(' ');

    res.render('lists');
});

module.exports = router;