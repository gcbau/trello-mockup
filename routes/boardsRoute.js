var express = require('express');
var router = express.Router();
var db = require('../models/index');

router.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

/**
 *  Render initial page
 */
router.get('/', function(req, res) 
{
    console.log('RENDER INTIAL BOARDS => ', req.session.user);
    console.log(' ');
    let user = req.session.user;
    let uid  = user.id;

    let query = `
        SELECT t.id "teamId", t.name "teamName", "tb"."boards"
        FROM (SELECT t.id, json_agg(b.*) AS "boards"
            FROM "teams" t
            FULL OUTER JOIN (SELECT * FROM "boards" b ORDER BY b."createdOn" DESC) b
                ON t."id" = "b"."teamId"
            LEFT JOIN "teamUsers" tu
                ON "tu"."teamId" = "t"."id"
            WHERE "b"."ownerId" = :id OR "tu"."userId" = :id
            GROUP BY t.id) tb
        LEFT JOIN "teams" t
            ON "t"."id" = "tb"."id"
    `;

    // execute query
    db.sequelize.query(query, {
        replacements: {
            id: uid
        },
        type: db.sequelize.QueryTypes.SELECT
    })
    .then( data => {
        renderPage(res, data);
    })
    .error( err => {
        next(createError(err));
    });
});

function renderPage(res, data)
{
    if (0 === data.length) {
        res.render('boards', {
            personalboards: [],
            teams: []
        });
    }
    let personal = data[data.length-1];
    let teams = data.slice(0, data.length-1);
    console.log(' ');
    console.log(data);
    console.log(' ');
    res.render('boards', {
        personalboards: personal.boards,
        teams: teams
    });
}

/**
 *  create a board
 */
router.post('/board', function(req, res) 
{
    // setup
    let insertQuery = `
        INSERT INTO "boards" 
            ("name", "ownerId", "lastViewed", "createdOn") 
        VALUES 
            (:name , :ownerId , NOW(), NOW()) 
        RETURNING * ;
    `;

    if (req.body.teamId) {
        insertQuery = `
            INSERT INTO "boards" 
                ("name", "ownerId", "teamId", "lastViewed", "createdOn") 
            VALUES 
                (:name, :ownerId, :teamId, NOW(), NOW()) 
            RETURNING * ;
        `;
    }

    // execute raw query
    db.sequelize.query(insertQuery, { 
        replacements: req.body, 
        type: db.sequelize.QueryTypes.INSERT 
    })
    .then( sqlres => {
        // return inserted data
        let data = sqlres[0][0];
        res.status(200).json(data);
    })
    .error( err => {
        next(err);
    });
});

/**
 *  Create a team
 */
router.post('/team', function(req, res) 
{
    // get request args
    let args = req.body;
    console.log(' ');
    console.log("ERIEHWORHQOHRIQWI => ",args);
    console.log(' ');

    let insertQuery = `
        INSERT INTO "teams" 
            ("name", "ownerId", "description") 
        VALUES 
            (:name, :ownerId, :description) 
        RETURNING * ;
    `;
    
    // insert into teams first
    db.sequelize.query(insertQuery, {
        replacements: args,
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
                userId: args.ownerId
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