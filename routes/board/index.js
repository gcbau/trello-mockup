var express = require('express');
var router = express.Router();
var db = require('../../models/index');

var status = require('http-status');
var createError = require('http-errors');

//**********************//
//*  FOR BACK BUTTON   *//
//**********************//
router.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

//**********************//
//*   RENDER PAGE      *//
//**********************//
router.get('/', function(req, res, next) 
{
    getRecentBoards(req, res, next);
}); 

function getRecentBoards(req, res, next) 
{
    let user = req.session.user;
    let uid  = user.id;

    // build query to get recent boards
    let query = `
        SELECT DISTINCT b.*
        FROM "boards" b
        LEFT JOIN "teams" t
                on b."teamId" = t.id
        LEFT JOIN "teamUsers" tu
                on t.id = tu."teamId"
        WHERE tu."userId" = :uid OR b."ownerId" = :uid
        ORDER BY  b."lastViewed" DESC
        LIMIT 4;
    `;

    // execute query
    db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: { uid: uid }
    })
    .then( recentBoards => {
        getPersonalTeamBoards(recentBoards, req, res, next);
    })
    .catch( err => {
        console.catch(err);
        next(err);
    })
}

function getPersonalTeamBoards(recentboards, req, res, next)
{
    let user = req.session.user;
    let uid  = user.id;
        
    // build query
    let query = `
    ( -- SELECT ALL BOARDS WITH NO TEAMID FIRST
        SELECT NULL "teamId", NULL "teamName", json_agg(b.*) "boards"
        FROM (SELECT * FROM "boards" b ORDER BY b."createdOn" DESC) AS b
        WHERE b."teamId" ISNULL AND b."ownerId" = :id
    )
    
    UNION ALL
    
    ( -- SELECT ALL BOARDS WITH TEAMID SECOND
    SELECT t."teamId", t."teamName", json_agg(b.*) AS "boards"
    FROM (
            SELECT tu."teamId", t."name" "teamName", tu."joinedAt"
            FROM "teamUsers" AS tu
            INNER JOIN "teams" AS t
                    ON tu."teamId" = t."id"
            WHERE tu."userId" = :id
    ) AS t
    LEFT JOIN (SELECT * FROM "boards" b ORDER BY b."createdOn" DESC) b
        ON b."teamId" = t."teamId"
    GROUP BY t."teamId", t."teamName", t."joinedAt"
    ORDER BY t."joinedAt" DESC
    );
    `;

    // execute query
    db.sequelize.query(query, {
        replacements: {
            id: uid
        },
        type: db.sequelize.QueryTypes.SELECT
    })
    .then( otherBoards => {
        renderPage(req, res, recentboards, otherBoards);
    })
    .catch( err => {
        next(createError(err));
    });
}

function renderPage(req, res, recentBoards, data)
{
    let initials = req.session.user.firstName[0].toUpperCase() + req.session.user.lastName[0].toUpperCase();
    if (0 === data.length) {
        res.render('boards', {
            personalboards: [],
            teams: [],
            recentBoards: recentBoards,
            userId: req.session.user.id,
            initials: initials
        });
    } else {
        console.log(data);
        let personal = data[0];
        let teams = data.slice(1, data.length);
        // let personal = data[0];
        // let teams = data.slice(1, data.length);

        if (personal.teamId) {
            res.render('boards', {
                personalboards: [],
                teams: data,
                recentBoards: recentBoards,
                userId: req.session.user.id,
                initials: initials
            });
            return;
        } 

        res.render('boards', {
            personalboards: personal.boards,
            teams: teams,
            recentBoards: recentBoards,
            userId: req.session.user.id,
            initials: initials
        });
    }
}

//**********************//
//*   CREATE A BOARD   *//
//**********************//
router.post('/board', function(req, res, next) 
{
    // check request values
    let name    = req.body.name;
    let ownerId = req.body.ownerId;

    if (!name || name === '') {
        next(createError(401, "board name field is missing"));
        return;
    }
    if (!ownerId || ownerId === '') {
        next(createError(500, "user ID is missing"));
        return;
    }

    // build insert query
    let insertQuery = `
        INSERT INTO "boards" 
            ("name", "ownerId", "lastViewed", "createdOn", "nameVectors") 
        VALUES 
            (:name , :ownerId , NOW(), NOW(), (to_tsvector(:name))) 
        RETURNING * ;
    `;

    if (req.body.teamId) {
        if (typeof req.body.teamId === 'string') {
            next(createError(400, 'teamId should never be a string'));
        }

        insertQuery = `
            INSERT INTO "boards" 
                ("name", "ownerId", "teamId", "lastViewed", "createdOn", "nameVectors") 
            VALUES 
                (:name, :ownerId, :teamId, NOW(), NOW(), (to_tsvector(:name))) 
            RETURNING * ;
        `;
    }

    // execute insert query into "boards"
    db.sequelize.query(insertQuery, { 
        replacements: req.body, 
        type: db.sequelize.QueryTypes.INSERT 
    })
    .then( sqlres => {
        // return inserted data
        let data = sqlres[0][0];
        res.status(200).json(data);
    })
    .catch( err => {
        let error = err;
        switch(err.name) {
            case 'SequelizeForeignKeyConstraintError': {
                error = createError(400, 'trying to add board by a user that does not exist');
                break;
            }
            default: {
                break;
            }
        }
        next(error);
    });
});

//**********************//
//*   CREATE A TEAM    *//
//**********************//
router.post('/team', function(req, res, next) 
{
    let teamName = req.body.name;
    let ownerId  = req.body.ownerId;
    let description = req.body.description;

    // check request body values
    if (!teamName || teamName === '') {
        next(createError(401, "team name field is missing"));
        return;
    }
    if (!ownerId || ownerId === '') {
        next(createError(500, "user ID is missing"));
        return;
    }
    if (!description) {
        req.body.description = '';
    }

    let insertQuery = `
        INSERT INTO "teams" 
            ("name", "ownerId", "description", "createdOn") 
        VALUES 
            (:name, :ownerId, :description, NOW()) 
        RETURNING * ;
    `;
    
    // insert into teams first
    db.sequelize.query(insertQuery, {
        replacements: req.body,
        type: db.sequelize.QueryTypes.INSERT
    })
    .then( sqlResponse => {
        let data = sqlResponse[0][0];

        if (!data.id) {
            next(createError(500, 'could not insert team into database for unexpected reason'));
            return;
        };

        insertQuery = `
            INSERT INTO "teamUsers" ("teamId","userId","joinedAt")
            VALUES (:teamId, :userId, NOW())`;

        // insert into teamUsers second
        db.sequelize.query(insertQuery, {
            replacements: {
                teamId: data.id,
                userId: req.body.ownerId
            },
            type: db.sequelize.QueryTypes.INSERT
        })
        .then( () => {
            res.status(200).json(data);
        })
        .catch( err => {
            next(createError(500, err));
            return;
        });
    })
    .catch( err => {
        let error = err;
        switch(err.name) {
            case 'SequelizeForeignKeyConstraintError': {
                error = createError(400, 'trying to add team by a user that does not exist');
                break;
            }
            default: {
                break;
            }
        }
        next(error);
    });
});

module.exports = router;