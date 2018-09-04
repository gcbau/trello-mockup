var express = require('express');
var router = express.Router();
var db = require('../models/index')

router.get('/b/:bid/:bname', function(req, res) {
    console.log(' ');
    console.log(req.params);
    console.log(' ');

    res.render('lists');
});

router.get('/team', function(req,res) {
    console.log(' ');
    console.log(req.query);
    console.log(' ');

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
    .error();

});

router.get('/list/:id/:bid', function(req,res) {
    let query = `
        SELECT l.*
        FROM "lists" l
        JOIN "boards" b
            ON l."boardId" = b."id"
        WHERE l."ownerId" = :id AND b."id" = :bid
        ORDER BY l.order;
    `;

    db.sequelize.query(query, {
        replacements: req.params,
        type: db.sequelize.QueryTypes.SELECT
    }).then( data => {
        res.status(200).json(data);
    }).error( err => {
        console.error(err);
    });
});

router.post('/list', function(req,res) {
    let query = `
        INSERT INTO "lists" 
            ("boardId", "ownerId", "name", "order")
        VALUES
            (:boardId, :ownerId, :name, :order)
        RETURNING * ;
    `;

    db.sequelize.query(query, {
        replacements: req.body,
        type: db.sequelize.QueryTypes.INSERT
    }).then( data => {
        res.status(200).json(data[0][0]);
    }
    ).error( err => {
        console.error(err);
    });
});

router.patch('/list/position', function(req,res,next) {
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
    });

});

module.exports = router;