var express = require('express');
var router = express.Router();

var status = require('http-status');
var createError = require('http-errors');

var db = require('../models/index');

router.get('/all/:uid', function(req,res,next) {
    let uid = req.params.uid;
    console.log(uid);
    
    getAllPersonalBoards(res, uid);
});

function getAllPersonalBoards(res, uid) 
{
    let personalQuery = `
    SELECT b."id", b."name"
    FROM "boards" AS b
    INNER JOIN "users" AS u ON (u."id" = b."ownerId")
    WHERE b."ownerId" = :ownerId;`;

    db.sequelize.query(personalQuery, {
        replacements: { 
            ownerId: uid
        }, 
        type: db.sequelize.QueryTypes.SELECT 
    })
    .then( personalboards => {
        getAllTeams(res, uid, personalboards);
    })
    .error( (err) => {
        console.error(err);
    });
}

function getAllTeams(res, uid, personalboards) 
{
    let teamQuery = `
    SELECT tu."teamId" AS tid, t."name" AS tname, array_agg(concat(b."id",';',b."name")) as boards
    FROM "users" AS u
    JOIN "teamUsers" AS tu ON (u."id" = tu."userId")
    JOIN "teams" AS t ON (tu."teamId" = t."id")
    LEFT JOIN (SELECT * FROM "boards" ORDER BY "boards"."id" DESC) AS b on (t.id = b."teamId")
    GROUP BY tu."teamId", t."name";`;

    db.sequelize.query(teamQuery, {
        replacements: {

        },
        type: db.sequelize.QueryTypes.SELECT
    })
    .then( teamboards => {
        console.log(teamboards, personalboards);
        res.status(200).json({
            teams: teamboards,
            personal: personalboards
        });
    })
    .error(err => {
        console.log(err);
    });
}

module.exports = router;