import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "Users";

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
          email: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          password: {
            type: DataTypes.TEXT,
            allowNull: false,
          },
          role: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: "client_viewer",
          },
          department: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "Planning Board",
          },
          status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: "active",
          },
          avatarBg: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "bg-rose-700 text-white",
          },
          refreshTokenHash: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          lastActive: {
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
