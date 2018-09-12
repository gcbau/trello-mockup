var express = require('express');
var router = express.Router();
var db = require('../../models/index');

router.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

/**
 *  Render initial page
 */
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
        console.error(err);
        next(err);
    })
}

function getPersonalTeamBoards(recentboards, req, res, next)
{
    let user = req.session.user;
    let uid  = user.id;

    // build query to get personal & team boards

        // SELECT t.id "teamId", t.name "teamName", "tb"."boards"
        // FROM (SELECT t.id, tu."joinedAt", json_agg(DISTINCT b.*) AS "boards"
        //     FROM "teams" t
        //     FULL OUTER JOIN (SELECT * FROM "boards" b ORDER BY b."createdOn" DESC) b
        //         ON t."id" = "b"."teamId"
        //     LEFT JOIN "teamUsers" tu
        //         ON "tu"."teamId" = "t"."id"
        //     WHERE "b"."ownerId" = :id OR "tu"."userId" = :id
        //     GROUP BY t.id, tu."joinedAt") tb
        // LEFT JOIN "teams" t
        //     ON "t"."id" = "tb"."id"
        // ORDER BY tb."joinedAt" DESC

        // SELECT t."teamId", t.name "teamName", json_agg(DISTINCT b.*) AS "boards"
        // FROM
        //     (SELECT DISTINCT ON (tu."joinedAt") tu."teamId", t."name", tu."joinedAt"
        //     FROM "teamUsers" tu
        //     INNER JOIN teams t
        //             ON tu."teamId" = t.id
        //     WHERE tu."userId" = :id) t
        // LEFT JOIN (SELECT * FROM "boards" b ORDER BY b."createdOn" DESC) b
        //     ON b."teamId" = t."teamId"
        // GROUP BY t."teamId", t.name, t."joinedAt"
        // ORDER BY t."joinedAt" DESC;
        

    let query = `
        SELECT t.id "teamId", t.name "teamName", json_agg(DISTINCT b.*) "boards"
        FROM (
            SELECT *
            FROM "boards" b
            ORDER BY b."createdOn" DESC
            ) AS b
        
        FULL OUTER JOIN (
                SELECT t."name", t."id", tu."userId", tu."joinedAt"
                FROM "teamUsers" tu
                INNER JOIN "teams" t ON tu."teamId" = t.id
                ) AS t
            ON b."teamId" = t."id"
        
        WHERE b."ownerId" = :id OR t."userId" = :id
        GROUP BY t.id, t.name, t."joinedAt"
        ORDER BY t."joinedAt" DESC
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
    .error( err => {
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

/**
 *  create a board
 */
router.post('/board', function(req, res) 
{
    // setup
    let insertQuery = `
        INSERT INTO "boards" 
            ("name", "ownerId", "lastViewed", "createdOn", "nameVectors") 
        VALUES 
            (:name , :ownerId , NOW(), NOW(), (to_tsvector(:name))) 
        RETURNING * ;
    `;

    if (req.body.teamId) {
        insertQuery = `
            INSERT INTO "boards" 
                ("name", "ownerId", "teamId", "lastViewed", "createdOn", "nameVectors") 
            VALUES 
                (:name, :ownerId, :teamId, NOW(), NOW(), (to_tsvector(:name))) 
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

    let insertQuery = `
        INSERT INTO "teams" 
            ("name", "ownerId", "description", "createdOn") 
        VALUES 
            (:name, :ownerId, :description, NOW()) 
        RETURNING * ;
    `;
    
    // insert into teams first
    db.sequelize.query(insertQuery, {
        replacements: args,
        type: db.sequelize.QueryTypes.INSERT
    })
    .then( sqlResponse => {
        let data = sqlResponse[0][0];

        insertQuery = `
            INSERT INTO "teamUsers" ("teamId","userId","joinedAt")
            VALUES (:teamId, :userId, NOW())`;

        // insert into teamUsers second
        db.sequelize.query(insertQuery, {
            replacements: {
                teamId: data.id,
                userId: args.ownerId
            },
            type: db.sequelize.QueryTypes.INSERT
        })
        .then( sqlResponse2 => {
            res.status(200).json(data);
        })
        .error();
    })
    .error( err => {
        console.error(err);
    });
});

module.exports = router;