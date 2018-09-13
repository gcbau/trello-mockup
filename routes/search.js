// Express
var express = require('express');
var router = express.Router();
// status
var status = require('http-status');
var createError = require('http-errors');
// Sequelize
var db = require('../models/index');

//******************//
//    Search Bar
//******************//

router.get('/search', function(req, res, next) 
{
    // searchBoards(req,res,next);

    // check if user input is valid
    let userInput = req.query.q.replace('-', ' ');
    let userId = req.session.user.id;

    // build query
    let query = `
        (
        SELECT NULL AS "cardId", NULL AS "cardName", b."id" AS "boardId", b."name" AS "boardName", ts_rank_cd(b."nameVectors", query, 10) AS "rank"
        FROM (
        
            SELECT DISTINCT b.*
            FROM "boards" b
            WHERE b."teamId" ISNULL AND "ownerId" = :userId
            -- select all the personal boards first
            UNION
            -- select all the team boards second
            SELECT DISTINCT b.*
            FROM "boards" b
            INNER JOIN "teamUsers" tu ON tu."teamId" = b."teamId"
            WHERE tu."userId" = :userId
        
        ) AS b, to_tsquery(:name) query
        WHERE query @@ b."nameVectors"
        ORDER BY "rank" DESC
        )
        UNION
        (
        SELECT DISTINCT c.id AS "cardId", c.name AS "cardName", b.id AS "boardId", b.name AS "boardName", ts_rank_cd(c."nameVectors", query) AS "rank"
        FROM "cards" c
        INNER JOIN "lists" l ON l."id" = c."listId"
        INNER JOIN "boards" b ON l."boardId" = b."id"
        LEFT JOIN "teamUsers" tU ON tU."teamId" = b."teamId",
             to_tsquery(:name) query
        WHERE (c."ownerId" = :userId OR tU."userId" = :userId)
          AND query @@ c."nameVectors"
        ORDER BY "rank" desc
        )
        ORDER BY "rank" desc, "cardId"
    `;

    // execute query
    db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: {
            name: userInput,
            userId: userId
        }
    })
    .then( (sqlres) => {
        res.status(200).json(sqlres);
    })
    .catch( (err) => {
        console.error("err");
        next(err);
    });
})



function searchBoards(req, res, next) 
{
    // check if user input is valid
    let userInput = req.query.q.replace('-', ' ');
    let userId = req.session.user.id;

    console.log(userInput);

    // build raw query
    let boardQuery = `
        SELECT b.id, b.name
        FROM "boards" b
        LEFT JOIN teams t
            ON b."teamId" = t.id
        LEFT JOIN "teamUsers" tu
            ON t.id = tu."teamId"
        WHERE (b."ownerId" = :id OR tu."userId" = :id) AND
            b."name" LIKE :userInput;
    `;

    // execute query
    db.sequelize.query(boardQuery, {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: {
            userInput: userInput,
            id: userId
        }
    })
    .then( (boards) => {
        searchCards(boards, req, res, next)
    })
    .catch( (err) => {
        console.error("err");
        next(err);
    });
}

function searchCards(boards, req, res, next)
{
    // check if user input is valid
    let userInput = req.query.q.replace('-',' ');
    let userId = req.session.user.id;

    // build raw query
    let cardQuery = `
        SELECT c.id,c.name, c."listId", b.id "boardId", b.name "boardName"
        FROM "cards" c
        JOIN lists l
                ON c."listId" = l.id
        JOIN boards b
                ON l."boardId" = b.id
        LEFT JOIN teams t
            ON b."teamId" = t.id
        LEFT JOIN "teamUsers" tu
            ON t.id = tu."teamId"
        WHERE (b."ownerId" = :id OR tu."userId" = :id) AND
            c."name" LIKE :userInput;
    `;

    // execute query
    db.sequelize.query(cardQuery, {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: {
            userInput: userInput,
            id: userId
        }
    })
    .then( (cards) => {
        res.status(200).json({
            boards: boards,
            cards: cards
        });
    })
    .catch( (err) => {
        console.error("err");
        next(err);
    });
    
}







module.exports = router;