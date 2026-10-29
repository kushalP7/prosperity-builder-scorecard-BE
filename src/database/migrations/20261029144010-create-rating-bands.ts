import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "RatingBands";

/** Baseline from production (prosperity-scoreboard). */
export default {
  up: async (queryInterface: QueryInterface) => {
    let transaction: Transaction | undefined;
    try {
      transaction = await sequelize.transaction();

      await queryInterface.createTable(
        tableName,
        {
          id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
          },
          settingsId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: "AppSettings",
              key: "id",
            },
          },
          label: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          min: {
            type: DataTypes.DOUBLE,
            allowNull: false,
          },
          max: {
            type: DataTypes.DOUBLE,
            allowNull: false,
          },
          color: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await transaction.commit();
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      throw err;
    }
  },
};
