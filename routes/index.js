var express = require('express');
var router = express.Router();
var db = require('../models/index');



router.get('/', function(req, res) 
{
    console.log(' ');
    console.log(req.session.user);
    let user = req.session.user;

    getAllPersonalBoards(res, user);
});

function getAllPersonalBoards(res, user) 
{
    let personalQuery = `
    SELECT b."id", b."name"
    FROM "boards" AS b
    INNER JOIN "users" AS u ON (u."id" = b."ownerId")
    WHERE b."ownerId" = :ownerId;`;

    db.sequelize.query(personalQuery, {
        replacements: { 
            ownerId: user.id 
        }, 
        type: db.sequelize.QueryTypes.SELECT 
    })
    .then( personalboards => {
        getAllTeams(res, user, personalboards);
    })
    .error( (err) => {
        console.error(err);
    });
}

function getAllTeams(res, user, personalboards) 
{
    let teamQuery = `
    SELECT tu."teamId" AS tid, t."name" AS tname, array_agg(concat(b."id",';',b."name")) as boards
    FROM "users" AS u
    JOIN "teamUsers" AS tu ON (u."id" = tu."userId")
    JOIN "teams" AS t ON (tu."teamId" = t."id")
    LEFT JOIN boards b on (t.id = b."teamId")
    GROUP BY tu."teamId", t."name";`;

    db.sequelize.query(teamQuery, {
        replacements: {

        },
        type: db.sequelize.QueryTypes.SELECT
    })
    .then( teamboards => {
        console.log(teamboards);
        renderPage(res, personalboards, teamboards)
    })
    .error(err => {
        console.log(err);
    });
}

function renderPage(res, personalboards, teams)
{
    res.render('index', {
        personalboards: personalboards,
        teams: teams
    });
}








router.post('/createboard', function(req, res) 
{
    let insertQuery = `INSERT INTO "boards" ("name","ownerId","lastViewed") VALUES (:name, :ownerId, NOW()) RETURNING *`;
    if (!req.body.ownerId) {
        insertQuery = `INSERT INTO "boards" ("name","teamId","lastViewed") VALUES (:name, :teamId, NOW()) RETURNING *`;
    }
    db.sequelize.query(insertQuery, { 
        replacements: req.body, 
        type: db.sequelize.QueryTypes.INSERT 
    })
    .then(function(sqlResponse) {
        let data = sqlResponse[0][0];
        res.status(200).json(data);
    })
    .error(function(err) {
        console.error(err);
    });
});

router.post('/createTeam', function(req, res) 
{
    console.log(req.body);
    let insertQuery = `
        INSERT INTO "teams" ("name") 
        VALUES (:name) RETURNING *`;
    
    // insert into teams first
    db.sequelize.query(insertQuery, {
        replacements: req.body,
        type: db.sequelize.QueryTypes.INSERT
    })
    .then( sqlResponse => {
        let data = sqlResponse[0][0];
        console.log('inside /createTeam teams => ', data);

        insertQuery = `
            INSERT INTO "teamUsers" ("teamId","userId")
            VALUES (:teamId, :userId)`;

        // insert into teamUsers second
        db.sequelize.query(insertQuery, {
            replacements: {
                teamId: data.id,
                userId: req.body.userId
            },
            type: db.sequelize.QueryTypes.INSERT
        })
        .then( sqlResponse2 => {
            console.log('inside /createTeam team_users => ', sqlResponse2);
            res.status(200).json(data);
        })
        .error();
    })
    .error( err => {
        console.error(err);
    });
}); 

module.exports = router;