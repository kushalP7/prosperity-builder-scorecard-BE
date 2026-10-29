import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "TemplateGroups";

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
          categoryId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: "TemplateCategories",
              key: "id",
            },
          },
          label: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          description: {
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
          weight: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            defaultValue: 2.0,
          },
          highestScore: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            defaultValue: 4.0,
          },
          scoringRules: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: "[]",
          },
          columnDefaults: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: "{}",
          },
          scoringType: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "value",
          },
          formula: {
            type: DataTypes.TEXT,
            allowNull: true,
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
