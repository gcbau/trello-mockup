var express = require('express');
var router = express.Router();
var db = require('../models/index');

router.get('/card/:uid/:bid', function(req,res) 
{
    console.log(' ');
    console.log('GET: /card/:uid/:bid');
    console.log(req.params);
    console.log(' ');

    let query = `
        SELECT l.id listId, json_agg(c.*) cards
        FROM lists l
        LEFT JOIN (SELECT c.* FROM cards c ORDER BY c."order" DESC) c
                ON c."listId" = l.id
        LEFT JOIN boards b
                ON l."boardId" = b.id
        LEFT JOIN teams t
                ON b."teamId" = t.id
        LEFT JOIN "teamUsers" tu
                ON t.id = tu."teamId"
        WHERE (tu."userId" = :uid OR 
               c."ownerId" = :uid OR
               l."ownerId" = :uid) AND b.id=:bid
        GROUP BY l.id
        ORDER BY l."order" ASC;
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
            ("listId", "ownerId", "name", "description", "order", "createdOn")
        VALUES
            (:listId, :ownerId, :name, :description, :order, NOW())
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

router.patch('/card/position', function(req,res) 
{
    let cards = req.body.cards;
    let listId = req.body.listId;
});

module.exports = router;