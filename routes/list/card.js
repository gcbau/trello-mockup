var express = require('express');
var router = express.Router();
var db = require('../../models/index');

router.get('/card/:uid/:bid', function(req,res) 
{
    console.log(' ');
    console.log('GET: /card/:uid/:bid');
    console.log(req.params);
    console.log(' ');

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

router.post('/card', function(req,res) 
{
    console.log('POST: /card');
    console.log(req.body);

    let query = `
        INSERT INTO "cards"
            ("listId", "ownerId", "name", "description", "order", "createdOn", "nameVectors")
        VALUES
            (:listId, :ownerId, :name, :description, :order, NOW(), to_tsvector(:name))
        RETURNING * ;
    `;

    db.sequelize.query(query, {
        replacements: req.body,
        type: db.sequelize.QueryTypes.INSERT
    })
    .then( (data) => {
        res.status(200).json(data[0][0]);
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
    .error( err => {
        console.error(err);
        next(err);
    });
});

module.exports = router;