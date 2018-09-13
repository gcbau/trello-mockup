var express = require('express');
var router = express.Router();
var db = require('../../models/index');

var status = require('http-status');
var createError = require('http-errors');

router.get('/card/:uid/:bid', function(req,res, next) 
{


    let query = `
        SELECT l.id listId, json_agg(c.*) cards
        FROM "boards" b
        LEFT JOIN "lists" l
                ON l."boardId" = b."id"
        LEFT JOIN (SELECT *
                FROM "cards" c
                ORDER BY c."listId", c."order") c
                ON c."listId" = l."id"
        WHERE b."id" = :bid
        GROUP BY l.id
        ORDER BY l.order;
    `;

    db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: req.params
    })
    .then( (data) => {
        res.status(200).json(data);
    });

})

router.post('/card', function(req,res, next) 
{
    let name        = req.body.name;
    let ownerId     = req.body.ownerId;
    let listId      = req.body.listId;
    let description = req.body.description;
    let order       = req.body.order;

    // check request values
    if (!name || name === '') {
        next(createError(401, "board name field is missing"));
        return;
    }
    if (!ownerId || ownerId === '') {
        next(createError(500, "user ID value is missing"));
        return;
    }
    if (!listId) {
        next(createError(401, "list ID value is missing"));
        return;
    }
    if (!order) {
        next(createError(401, "order value is missing"));
        return;
    }
    if (typeof listId === 'string') {
        next(createError(401, "list ID must never be a string"));
        return;
    }
    if (typeof order === 'string') {
        next(createError(401, "order must never be a string"));
        return;
    }

    if (!description) {
        req.body.description = '';
    }

    // build insertion querystring
    let query = `
        INSERT INTO "cards"
            ("listId", "ownerId", "name", "description", "order", "createdOn", "nameVectors")
        VALUES
            (:listId, :ownerId, :name, :description, :order, NOW(), to_tsvector(:name))
        RETURNING * ;
    `;

    // execute query
    db.sequelize.query(query, {
        replacements: req.body,
        type: db.sequelize.QueryTypes.INSERT
    })
    .then( (data) => {
        res.status(200).json(data[0][0]);
    })
    .catch( (err) => {
        let error = err;
        next(createError(400, error));
    })
});

router.patch('/list/:lid/card', function(req,res, next) 
{
    // get parameters
    let cards = JSON.parse(req.body.cards);
    let lid = req.params.lid;

    // build queries
    let queries = '';
    for (let i=0; i<cards.length; ++i) {
        let card = cards[i];
        console.log(card);
        queries += `
            UPDATE "cards"
            SET "order" = ${card.order},
                "listId"= ${lid}
            WHERE "id" = ${card.cid}
            RETURNING *;
        `;
    }

    // execute queries
    db.sequelize.query(queries, {
        type: db.sequelize.QueryTypes.UPDATE
    })
    .then( hello => {
        res.status(200).json(hello);
    })
    .catch( err => {
        console.catch(err);
        next(err);
    });
});

module.exports = router;