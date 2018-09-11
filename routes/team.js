// Express
var express = require('express');
var router = express.Router();

// Sequelize
var db = require('../models/index');

router.get('/team/:teamId/members', function(req, res, next) 
{
    console.log(req.params);

    // check request

    // build raw query
    let query = `
        SELECT u."id", u."firstName", u."lastName"
        FROM "teamUsers" tu
        JOIN "users" u
            ON u."id" = tu."userId"
        WHERE tu."teamId" = :teamId
    `;

    // execute raw query
    db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: req.params
    })
    .then( members => {
        res.status(200).json(members);
    })
    .catch( err => {
        console.error(err);
        next(err);
    });
});

module.exports = router;