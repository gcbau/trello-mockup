'use strict';

const table='boards';
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
      ownerId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      teamId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'teams',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      name:        { type: Sequelize.STRING, allowNull: false },
      lastViewed:  { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      createdOn:   { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
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
        ['createdOn'], {
          indexType: 'BTREE'
      });
    })
    .then(() => {
      return queryInterface.addIndex(
        table,
        ['lastViewed'], {
          indexType: 'BTREE'
      });
    })
    .then(() => {
      let query = '';
      query += `ALTER TABLE "boards" ADD "nameVectors" tsvector;`;
      query += `CREATE INDEX board_name_vector_index ON "boards" USING gin("nameVectors");`

      return queryInterface.sequelize.query(query);
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
