import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "Inquiries";

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
          firstName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          },
          lastName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          },
          organizationName: {
          type: DataTypes.STRING(200),
          allowNull: false,
          },
          jobTitle: {
          type: DataTypes.STRING(150),
          allowNull: false,
          },
          businessEmail: {
          type: DataTypes.STRING(150),
          allowNull: false,
          },
          phoneNumber: {
          type: DataTypes.STRING(50),
          allowNull: false,
          },
          city: {
          type: DataTypes.STRING(100),
          allowNull: false,
          },
          state: {
          type: DataTypes.STRING(100),
          allowNull: false,
          },
          country: {
          type: DataTypes.STRING(100),
          allowNull: false,
          defaultValue: "United States",
          },
          organizationType: {
          type: DataTypes.STRING(100),
          allowNull: false,
          },
          notes: {
          type: DataTypes.TEXT,
          allowNull: true,
          },
          status: {
          type: DataTypes.ENUM("pending", "contacted", "qualified", "closed"),
          allowNull: false,
          defaultValue: "pending",
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
