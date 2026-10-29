import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "LandingMedia";

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
          mediaType: {
            type: DataTypes.ENUM("video", "audio", "document"),
            allowNull: true,
            defaultValue: "video",
          },
          videoSource: {
            type: DataTypes.STRING(255),
            allowNull: true,
          },
          audioSource: {
            type: DataTypes.STRING(255),
            allowNull: true,
          },
          sourceUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          category: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "Luminaries Podcasts",
          },
          description: {
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
