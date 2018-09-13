var express = require('express');
var router = express.Router();

var status = require('http-status');
var createError = require('http-errors');

var db = require('../../models/index');

router.get('/card/:id', function(req,res,next) 
{
    console.log(`/card/${req.params.id}`);
    // build raw query
    let query = `
        SELECT
            c.id,                                   -- select card ID
            c.name,                                 -- select card name
            c.description,                          -- select card Description

            (SELECT json_agg(l.*) "labels"
        FROM "cards" c
        LEFT JOIN "cardLabels" cl
            ON cl."cardId" = c."id"
        LEFT JOIN "labels" l
            ON l."id" = cl."labelId"
        WHERE c."id" = :id
        GROUP BY c.id) "labels",                       -- select all relevant labels

            (SELECT json_agg( (SELECT x FROM (SELECT co.id, co.body, co."createdOn", co."userId", u."firstName", u."lastName") x ) )
        FROM (SELECT * FROM "comments" ORDER BY "comments"."createdOn" DESC) co
        JOIN (SELECT u.id, u."firstName", u."lastName" FROM "users" u) u
            ON co."userId" = u.id
        WHERE co."cardId" = :id) "comments"            -- select all relevant comments

        FROM "cards" c
        WHERE c.id = :id;
    `;

    // execute raw query
    db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: req.params
    })
    .then( (info) => {
        res.status(200).json(info[0]);
    })
    .catch( (err) => {
        next(createError(err));
    });
});

//*********************//
//  STORE DESCRIPTION
//*********************//
router.patch('/description', function(req,res,next)
{
    console.log(req.body);

    // build query
    let query = `
        UPDATE "cards" c
        SET "description" = :description
        WHERE c."id" = :cardId;
    `;

    db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.UPDATE,
        replacements: req.body
    })
    .then( (sqlres) => {
        res.status(200).json(sqlres);
    })
    .catch( (err) => {
        console.error(err);
        next(err);
    })
})

//******************//
//  RETRIEVE LABEL
//******************//

router.post('/label', function(req,res,next)
{
    console.log(req.body);

    // check if label already created
    checkLabel(req, res, next);

});

function checkLabel(req, res, next)
{
    // build raw query
    let query = `
        SELECT *
        FROM "labels" l
        WHERE l."name" = :name
    `;
    
    // execute raw query
    db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.INSERT,
        replacements: req.body
    })
    .then( (label) => {
        // if label doesn't exist
        if (0 >= label[1]) {
            createLabel(req, res, next);
        } else {
            addLabelToCard(label[0][0], req, res, next);
        }
    })
    .catch( (err) => {
        console.log(err);
    });
}

function createLabel(req, res, next) 
{
    // build raw query
    let query = `
        INSERT INTO "labels"
            ("name", "createdOn")
        VALUES
            (:name, NOW())
        RETURNING *
    `;

    // execute raw query
    db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.INSERT,
        replacements: req.body
    })
    .then( (label) => {
        addLabelToCard(label[0][0], req, res, next);
    })
    .catch( (err) => {
        console.error("ERROR in createLabel()");
        console.error(err);
        next(createError(err, "cannot create label when name does not exists"));
    });
}

function addLabelToCard(label, req, res, next) 
{
    console.log(" ");
    console.log(label, req.body);
    console.log(" ");

    let query = `
        INSERT INTO "cardLabels"
            ("cardId", "labelId")
        VALUES
            (:cardId, :labelId)
        RETURNING *
    `;

    db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.INSERT,
        replacements: {
            cardId: req.body.cardId,
            labelId: label.id
        }
    })
    .then( () => {
        res.status(200).json(label);
    })
    .catch( (err) => {
        console.error("ERROR in addLabelToCard()");
        console.error(err);

        switch(err.name) {
            case 'SequelizeUniqueConstraintError': {
                res.status(200).json(label);
                break;
            }
            default:
                next(createError(err));
        }
    });
}

//**************************//
//   DELETE LABEL IN CARD
//**************************//

router.delete('/card/:cardId/label/:labelId', function(req, res, next) 
{
    console.log(req.params);
    // build raw query
    let query = `
        DELETE FROM "cardLabels" cl
        WHERE cl."cardId" = :cardId AND cl."labelId" = :labelId
        RETURNING * ;
    `;

    // execute raw query
    db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.DELETE,
        replacements: req.params
    })
    .then( (data) => {
        console.log(data);
        res.status(200).json(data);
    })
    .catch( (err) => {
        console.error(err);
        next(err);
    })


    res.end();
})

//**************************//
//    GET CARD COMMENTS
//**************************//

router.get('/card/:cardId/comment', function (req, res, next) 
{
    console.log(req.params);

    // check request
    let cardId = req.params.cardId;

    // build raw query
    let query = `
        SELECT *
        FROM "comments" c
        WHERE c."cardId" = :cardId
        ORDER BY c."createdOn";
    `;

    // execute query
    db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: { cardId: cardId }
    })
    .then( comments => {
        res.status(200).json(comments);
    })
    .catch( err => {
        console.error(err);
        next(err);
    })
});

//**************************//
//      CREATE COMMENT
//**************************//

router.post('/card/:cardId/comment', function(req, res, next) 
{
    console.log(req.body);

    // check request
    let body = req.body.body;
    let userId = req.session.user.id;
    let cardId = req.params.cardId;

    // build raw query
    let query = `
        INSERT INTO "comments"
            ("cardId","userId","createdOn","body")
        VALUES
            (:cardId, :userId, NOW(), :body)
        RETURNING *;

        SELECT u."firstName", u."lastName"
        FROM "users" u
        WHERE u."id" = :userId;
    `;

    // execute raw query
    db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.INSERT,
        replacements: {
            cardId: cardId,
            userId: userId,
            body: body
        }
    })
    .then( comment => {
        res.status(200).json(comment);
    })
    .catch( err => {
        console.error(err);
        next(err);
    })
});

module.exports = router;