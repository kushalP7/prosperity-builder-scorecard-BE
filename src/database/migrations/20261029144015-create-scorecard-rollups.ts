import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "ScorecardRollups";

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
          projectId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: "Projects",
              key: "id",
            },
          },
          overallScoreTenScale: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: "0",
          },
          overallScorePercentage: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: "0",
          },
          performanceBand: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: "Average",
          },
          categoryScores: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: "[]",
          },
          isCalibrated: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
          },
          calibrationNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          analystOverrides: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: "{}",
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
