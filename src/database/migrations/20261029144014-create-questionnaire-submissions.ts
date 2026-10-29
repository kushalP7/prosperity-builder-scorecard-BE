import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "QuestionnaireSubmissions";

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
          status: {
            type: DataTypes.ENUM("DRAFT", "SUBMITTED", "VERIFIED"),
            allowNull: true,
            defaultValue: "DRAFT",
          },
          completedPointsCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
          },
          totalPointsCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 92,
          },
          answersPayload: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: "{}",
          },
          submittedAt: {
            type: DataTypes.DATE,
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
