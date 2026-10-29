import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "ExternalDataStaging";

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
          source: {
            type: DataTypes.ENUM("US_CENSUS", "ESRI", "BLS", "EPA", "NCDOT_GIS", "NC_DPI", "CDC_PLACES"),
            allowNull: false,
          },
          categoryKey: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          metricKey: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          metricLabel: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          rawResponse: {
            type: DataTypes.JSONB,
            allowNull: true,
          },
          extractedValue: {
            type: DataTypes.DOUBLE,
            allowNull: true,
          },
          unit: {
            type: DataTypes.STRING(255),
            allowNull: true,
          },
          ingestionStatus: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "FETCHED",
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
