var express = require('express');
var router = express.Router();

var status = require('http-status');
var createError = require('http-errors');

var db = require('../models/index');

router.get('/card/:cid', function(req,res,next) 
{
    console.log(`/card/${req.params.cid}`);
}) 

module.exports = router;