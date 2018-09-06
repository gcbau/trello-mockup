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
    searchBoards(req,res,next);
})

function searchBoards(req, res, next) 
{
    // check if user input is valid
    let userInput = req.query.q;
    let userId = req.session.user.id;

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
    let userInput = req.query.q;
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