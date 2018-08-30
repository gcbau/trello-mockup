var express = require('express');
var router = express.Router();

router.get('*', function(req, res, next) {
    if (!req.session || !req.session.user) {
        res.redirect('/home');
    } else {
        next();
    }
});

module.exports = router;