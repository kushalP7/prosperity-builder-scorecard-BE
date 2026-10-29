import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "LandingReports";

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
          slug: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          subtitle: {
            type: DataTypes.STRING(255),
            allowNull: true,
          },
          author: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "Kathleen Rose, CCIM, CRE",
          },
          publishedAt: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          coverImage: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          pdfUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          summary: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          contentHtml: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          featured: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
          },
          status: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "published",
          },
          blocks: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: "[]",
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
          type: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "report",
          },
          externalUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
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
