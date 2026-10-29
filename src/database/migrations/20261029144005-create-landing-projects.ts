import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "LandingProjects";

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
          title: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          category: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          studyType: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          latitude: {
            type: DataTypes.DOUBLE,
            allowNull: false,
          },
          longitude: {
            type: DataTypes.DOUBLE,
            allowNull: false,
          },
          pdfUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          featured: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
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
