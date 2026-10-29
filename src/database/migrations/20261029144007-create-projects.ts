import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { sequelize } from '../sequelize';

const tableName = "Projects";

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
          clientName: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          clientEmail: {
            type: DataTypes.STRING(255),
            allowNull: true,
          },
          jurisdictionType: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "COUNTY",
          },
          year: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          status: {
            type: DataTypes.ENUM("ONBOARDING", "INTAKE_PENDING", "INTAKE_SUBMITTED", "INGESTION_RUNNING", "CALCULATED", "IN_REVIEW", "PUBLISHED", "ARCHIVED"),
            allowNull: true,
            defaultValue: "INTAKE_PENDING",
          },
          packageType: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "Scorecard Standard",
          },
          totalProjectValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 5000,
          },
          bypassPayments: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
          },
          image: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          assignedSections: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: "[]",
          },
          enabledWidgets: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
          },
          dashboardLayout: {
            type: DataTypes.JSONB,
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
          state: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "NC",
          },
          county: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "Lee County",
          },
          stateFips: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "37",
          },
          countyFips: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "105",
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
