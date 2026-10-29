import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "TemplateColumns";

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
          name: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          type: {
            type: DataTypes.ENUM("number", "boolean", "text", "formula", "select"),
            allowNull: false,
          },
          unit: {
            type: DataTypes.STRING(255),
            allowNull: true,
          },
          weight: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            defaultValue: "1",
          },
          isBonus: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
          },
          isReadOnly: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
          },
          formulaExpression: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          options: {
            type: DataTypes.JSONB,
            allowNull: true,
          },
          validationMin: {
            type: DataTypes.DOUBLE,
            allowNull: true,
          },
          validationMax: {
            type: DataTypes.DOUBLE,
            allowNull: true,
          },
          scoringRule: {
            type: DataTypes.JSONB,
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
          sectionId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
              model: "TemplateSections",
              key: "id",
            },
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
