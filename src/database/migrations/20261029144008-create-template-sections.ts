import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "TemplateSections";

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
          label: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          description: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          accentColor: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "#B5111B",
          },
          icon: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "Layers",
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          version: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
          },
          isLatest: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
          },
          status: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "active",
          },
          versionGroupId: {
            type: DataTypes.UUID,
            allowNull: true,
          },
          changelog: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          snapshot: {
            type: DataTypes.JSONB,
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
