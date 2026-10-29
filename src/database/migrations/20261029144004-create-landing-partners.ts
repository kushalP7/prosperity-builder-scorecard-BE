import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "LandingPartners";

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
          logoUrl: {
            type: DataTypes.TEXT,
            allowNull: false,
          },
          sortOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          status: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "published",
          },
          deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
          },
          deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
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
