var express = require('express');
var router = express.Router();
var db = require('../../models/index');

var status = require('http-status');
var createError = require('http-errors');

//*******************//
//*   RENDER PAGE   *//
//*******************//
router.get('/b/:bid/:bname', function(req, res, next) 
{
    // update board's last viewed
    let query = `
        UPDATE "boards" b
        SET "lastViewed" = NOW()
        WHERE b."id" = :bid
        RETURNING *;
    `;

    db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.UPDATE,
        replacements: req.params
    })
    .then( sqlRes => {
        getPersonalTeamBoards(req,res,next)
        // render list view
        // res.render('lists');
    })
    .catch( err => {
        next(err);
    })
});


function getPersonalTeamBoards(req, res, next)
{
    let user = req.session.user;
    let uid  = user.id;

    // build query to get personal & team boards
    let query = `
        SELECT t.id "teamId", t.name "teamName", "tb"."boards"
        FROM (SELECT t.id, tu."joinedAt", json_agg(DISTINCT b.*) AS "boards"
            FROM "teams" t
            FULL OUTER JOIN (SELECT * FROM "boards" b ORDER BY b."createdOn" DESC) b
                ON t."id" = "b"."teamId"
            LEFT JOIN "teamUsers" tu
                ON "tu"."teamId" = "t"."id"
            WHERE "b"."ownerId" = :id OR "tu"."userId" = :id
            GROUP BY t.id, tu."joinedAt") tb
        LEFT JOIN "teams" t
            ON "t"."id" = "tb"."id"
        ORDER BY tb."joinedAt" DESC
    `;

    // execute query
    db.sequelize.query(query, {
        replacements: {
            id: uid
        },
        type: db.sequelize.QueryTypes.SELECT
    })
    .then( otherBoards => {
        renderPage(req, res, otherBoards);
    })
    .catch( err => {
        next(createError(err));
    });
}

function renderPage(req, res, data)
{
    let initials = req.session.user.firstName[0].toUpperCase() + req.session.user.lastName[0].toUpperCase();
    if (0 === data.length) {
        res.render('lists', {
            personalboards: [],
            teams: [],
            userId: req.session.user.id,
            initials: initials
        });
    } else {
        let personal = data[0];
        let teams = data.slice(1, data.length);

        if (personal.teamId) {
            res.render('lists', {
                personalboards: [],
                teams: data,
                userId: req.session.user.id,
                initials: initials
            });
            return;
        } 

        res.render('lists', {
            personalboards: personal.boards,
            teams: teams,
            userId: req.session.user.id,
            initials: initials
        });
    }
}

//*****************************//
//*   GET TEAM ID FROM BOARD  *//
//*****************************//
router.get('/team', function(req,res, next)
{
    let query = `
        SELECT b."teamId"
        FROM "boards" b
        WHERE b."id" = :bid
    `;

    db.sequelize.query(query, {
        replacements: req.query,
        type: db.sequelize.QueryTypes.SELECT
    })
    .then( (data) => {
        res.status(200).json(data[0].teamId);
    })
    .catch();

});

//******************************//
//*   GET ALL LISTS IN ORDER   *//
//******************************//
router.get('/list/:id/:bid', function(req,res, next) 
{
    let query = `
        SELECT DISTINCT l.*
        FROM "lists" l
        JOIN "boards" b
            ON l."boardId" = b."id"
        LEFT JOIN "teamUsers" tu
            ON b."teamId" = tu."teamId"
        WHERE (l."ownerId" = :id OR tu."userId" = :id)
            AND b."id" = :bid
        ORDER BY l.order;
    `;

    db.sequelize.query(query, {
        replacements: req.params,
        type: db.sequelize.QueryTypes.SELECT
    }).then( data => {
        res.status(200).json(data);
    }).catch( err => {
        
    });
});

//********************//
//*   CREATE LIST    *//
//********************//
router.post('/list', function(req,res, next) 
{
    let name    = req.body.name;
    let ownerId = req.body.ownerId;
    let boardId = req.body.boardId;
    let order   = req.body.order;

    // check request values
    if (!name || name === '') {
        next(createError(401, "list name field is missing"));
        return;
    }
    if (!ownerId) {
        next(createError(401, "owner ID value is missing"));
        return;
    }
    if (!boardId) {
        next(createError(401, "board ID value is missing"));
        return;
    }
    if (!order) {
        next(createError(401, "order value is missing"));
        return;
    }
    if (typeof ownerId === 'string') {
        next(createError(401, "user ID must never be a string"));
        return;
    }
    if (typeof boardId === 'string') {
        next(createError(401, "board ID must never be a string"));
        return;
    }
    if (typeof order === 'string') {
        next(createError(401, "order must never be a string"));
        return;
    }

    // build insertion querystring
    let query = `
        INSERT INTO "lists" 
            ("boardId", "ownerId", "name", "order")
        VALUES
            (:boardId, :ownerId, :name, :order)
        RETURNING * ;
    `;

    // execute query
    db.sequelize.query(query, {
        replacements: req.body,
        type: db.sequelize.QueryTypes.INSERT
    })
    .then( data => {
        res.status(200).json(data[0][0]);
    })
    .catch( err => {
        let error = err;
        next(createError(400,error));
    });
});


//******************************//
//*   UPDATE ORDER OF LISTS    *//
//******************************//
router.patch('/board/:boardId/list', function(req,res,next) 
{
    let lists = JSON.parse(req.body.lists);
    let queries = '';
    for (let i=0; i<lists.length; ++i) {
        let list = lists[i];
        queries += `
            UPDATE "lists"
            SET "order" = ${list.order}
            WHERE "id" = ${list.lid}
            RETURNING *;
        `;
    }

    db.sequelize.query(queries, {
        type: db.sequelize.QueryTypes.UPDATE
    })
    .then( hello => {
        res.end();
    })
    .catch( (err) => {
        console.log(err);
        next(err)
    });

});

module.exports = router;