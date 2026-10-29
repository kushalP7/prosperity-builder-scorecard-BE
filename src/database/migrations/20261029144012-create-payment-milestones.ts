import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "PaymentMilestones";

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
          milestoneType: {
            type: DataTypes.ENUM("INITIAL_40", "MID_30", "FINAL_30"),
            allowNull: false,
          },
          amountDue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
          },
          percentage: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          status: {
            type: DataTypes.ENUM("PENDING", "PAID", "BYPASSED", "FAILED"),
            allowNull: true,
            defaultValue: "BYPASSED",
          },
          paymentMethod: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "ACH",
          },
          provider: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "MANUAL",
          },
          transactionReference: {
            type: DataTypes.STRING(255),
            allowNull: true,
          },
          clearedAt: {
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
