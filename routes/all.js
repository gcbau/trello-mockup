var express = require('express');
var router = express.Router();

var status = require('http-status');
var createError = require('http-errors');

var db = require('../models/index');

router.get('/all/:uid', function(req,res,next) {
    // setup
    let uid = req.params.uid;

    let query = `
        SELECT t.id "teamId", t.name "teamName", "tb"."boards"
        FROM (SELECT t.id, json_agg(b.*) AS "boards"
            FROM "boards" b
            LEFT JOIN "teams" t
                ON t."id" = "b"."teamId"
            LEFT JOIN "teamUsers" tu
                ON "tu"."teamId" = "t"."id"
            WHERE "b"."ownerId" = :id OR "tu"."userId" = :id
            GROUP BY t.id) tb
        LEFT JOIN "teams" t
            ON "t"."id" = "tb"."id"
        ORDER BY t."createdOn" DESC
    `;

    // execute query
    db.sequelize.query(query, {
        replacements: {
            id: uid
        },
        type: db.sequelize.QueryTypes.SELECT
    })
    .then( data => {
        res.status(200).json(data);
    })
    .error( err => {
        next(createError(err));
    });
});

module.exports = router;