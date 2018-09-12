'use strict';

const table="teamUsers";
module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    return queryInterface.createTable(table, {
      teamId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'teams',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      userId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      joinedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    })
    .then(() => {
      return queryInterface.addIndex(
        table,
        ['joinedAt'], {
          indexType: 'BTREE'
      });
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
