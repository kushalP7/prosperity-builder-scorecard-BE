import { QueryInterface, DataTypes, Transaction } from 'sequelize';

async function addColumnIfMissing(
  queryInterface: QueryInterface,
  table: string,
  column: string,
  definition: any,
  transaction: Transaction,
) {
  const desc = await queryInterface.describeTable(table, { transaction } as any);
  if (!(column in desc)) {
    await queryInterface.addColumn(table, column, definition, { transaction });
  }
}

/**
 * Phase-2 columns (portal invite, geo city/place, orders link, certified report).
 * Idempotent: skips columns that already exist (e.g. local after sync).
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    let transaction: Transaction | undefined;
    try {
      transaction = await queryInterface.sequelize.transaction();

      // ---- Projects ----
      await addColumnIfMissing(queryInterface, 'Projects', 'customerUserId', {
        type: DataTypes.UUID,
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Projects', 'orderId', {
        type: DataTypes.UUID,
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Projects', 'city', {
        type: DataTypes.STRING,
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Projects', 'placeFips', {
        type: DataTypes.STRING(5),
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Projects', 'locationConfirmed', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Projects', 'certifiedReportUrl', {
        type: DataTypes.TEXT,
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Projects', 'certifiedReportPublicId', {
        type: DataTypes.STRING,
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Projects', 'certifiedReportFileName', {
        type: DataTypes.STRING,
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Projects', 'certifiedReportUploadedAt', {
        type: DataTypes.DATE,
        allowNull: true,
      }, transaction);

      // ---- Users ----
      await addColumnIfMissing(queryInterface, 'Users', 'subscriptionStatus', {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'none',
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Users', 'subscriptionPackage', {
        type: DataTypes.STRING(50),
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Users', 'subscribedAt', {
        type: DataTypes.DATE,
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Users', 'subscriptionExpiresAt', {
        type: DataTypes.DATE,
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Users', 'avatarUrl', {
        type: DataTypes.TEXT,
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Users', 'inviteTokenHash', {
        type: DataTypes.STRING(128),
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Users', 'inviteTokenExpiresAt', {
        type: DataTypes.DATE,
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Users', 'leadRole', {
        type: DataTypes.STRING(32),
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Users', 'jurisdictionType', {
        type: DataTypes.STRING(16),
        allowNull: true,
      }, transaction);

      // ---- Inquiries ----
      await addColumnIfMissing(queryInterface, 'Inquiries', 'leadRole', {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'partner_vendor',
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Inquiries', 'userId', {
        type: DataTypes.UUID,
        allowNull: true,
      }, transaction);

      await addColumnIfMissing(queryInterface, 'Inquiries', 'invitedAt', {
        type: DataTypes.DATE,
        allowNull: true,
      }, transaction);

      // Support invited / registered (and keep legacy enum values as plain strings)
      const inquiryCols = await queryInterface.describeTable('Inquiries', {
        transaction,
      } as any);
      if (inquiryCols.status) {
        await queryInterface.changeColumn(
          'Inquiries',
          'status',
          {
            type: DataTypes.STRING(32),
            allowNull: false,
            defaultValue: 'pending',
          },
          { transaction },
        );
      }

      await transaction.commit();
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      throw err;
    }
  },
};
