import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "AnalyticsWidgets";

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
          title: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          description: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          chartType: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          aggregation: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          sectionId: {
            type: DataTypes.UUID,
            allowNull: true,
          },
          categoryId: {
            type: DataTypes.UUID,
            allowNull: true,
          },
          columnId: {
            type: DataTypes.UUID,
            allowNull: true,
          },
          customFormula: {
            type: DataTypes.TEXT,
            allowNull: true,
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
