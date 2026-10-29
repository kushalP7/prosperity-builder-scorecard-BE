import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "ProjectDataRecords";

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
          nodeId: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          columnId: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          value: {
            type: DataTypes.JSONB,
            allowNull: true,
          },
          source: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          notes: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          scoreValue: {
            type: DataTypes.DOUBLE,
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
