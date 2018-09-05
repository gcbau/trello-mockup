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
        SELECT c.id, c.description, json_agg(l.*) "labels"
        FROM "cards" c
        LEFT JOIN "cardLabels" cl
            ON cl."cardId" = c."id"
        LEFT JOIN "labels" l
            ON l."id" = cl."labelId"
        WHERE c."id" = :id
        GROUP BY c.id, c.description;
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

//******************//
//      LABEL
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

function addLabelToCard(label, req, res, next) {
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
    .then( (labelcard) => {
        res.status(200).json(label);
    })
    .catch( (err) => {
        console.error("ERROR in addLabelToCard()");
        console.error(err);
        next(createError(err));
    });
}

module.exports = router;