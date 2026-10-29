import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "AppSettings";

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
          companyName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: "Rose Associates",
          },
          companyLogoUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          companyAddress: {
            type: DataTypes.STRING(255),
            allowNull: true,
          },
          companyPhone: {
            type: DataTypes.STRING(255),
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
          planPrices: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: "{\"reportPrice\": 15000, \"combinedPrice\": 48000, \"subscriptionPrice\": 36000}",
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
