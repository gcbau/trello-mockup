'use strict';

const table = 'cards'
module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    return queryInterface.createTable(table, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      listId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'lists',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      ownerId: {
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id"
        }
      },
      name:        { type: Sequelize.STRING,  allowNull: false },
      description: { type: Sequelize.STRING,  allowNull: false },
      order:       { type: Sequelize.INTEGER, allowNull: false },
      createdOn: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    })
    .then(() => {
      return queryInterface.addIndex(
        table,
        ['name'], {
          indexType: 'BTREE'
      });
    })
    .then(() => {
      return queryInterface.addIndex(
        table,
        ['order'], {
          indexType: 'BTREE'
      });
    })
    .then(() => {
      let queries = ``;
      queries += `ALTER TABLE "cards" ADD "nameVectors" tsvector; `;
      queries += `CREATE INDEX name_vector_index ON "cards" USING gin("nameVectors")`;

      return queryInterface.sequelize.query(queries);
    });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return queryInterface.dropTable(table);
  }
};
