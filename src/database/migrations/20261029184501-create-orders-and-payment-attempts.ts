import { QueryInterface, DataTypes, Transaction } from 'sequelize';

/**
 * Orders + PaymentAttempts (checkout / Stripe) — not present on prod baseline.
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    let transaction: Transaction | undefined;
    try {
      transaction = await queryInterface.sequelize.transaction();

      const tables = await queryInterface.showAllTables();
      const names = tables.map((t: any) =>
        typeof t === 'string' ? t : t.tableName || t.table_name || String(t),
      );

      if (!names.includes('Orders')) {
        await queryInterface.createTable(
          'Orders',
          {
            id: {
              type: DataTypes.UUID,
              allowNull: false,
              primaryKey: true,
            },
            orderNumber: {
              type: DataTypes.STRING,
              allowNull: false,
              unique: true,
            },
            packageType: {
              type: DataTypes.STRING(50),
              allowNull: false,
            },
            packageName: {
              type: DataTypes.STRING,
              allowNull: false,
            },
            amountDue: {
              type: DataTypes.DECIMAL(12, 2),
              allowNull: false,
            },
            amountPaid: {
              type: DataTypes.DECIMAL(12, 2),
              allowNull: false,
              defaultValue: 0,
            },
            status: {
              type: DataTypes.STRING(50),
              allowNull: false,
              defaultValue: 'pending',
            },
            customerName: {
              type: DataTypes.STRING,
              allowNull: false,
            },
            customerEmail: {
              type: DataTypes.STRING,
              allowNull: false,
            },
            organization: {
              type: DataTypes.STRING,
              allowNull: true,
            },
            customerUserId: {
              type: DataTypes.UUID,
              allowNull: true,
            },
            provider: {
              type: DataTypes.STRING,
              allowNull: true,
              defaultValue: 'stub',
            },
            stripePaymentIntentId: {
              type: DataTypes.STRING,
              allowNull: true,
              unique: true,
            },
            paidAt: {
              type: DataTypes.DATE,
              allowNull: true,
            },
            refundedAt: {
              type: DataTypes.DATE,
              allowNull: true,
            },
            reminderSentCount: {
              type: DataTypes.INTEGER,
              allowNull: false,
              defaultValue: 0,
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
      }

      if (!names.includes('PaymentAttempts')) {
        await queryInterface.createTable(
          'PaymentAttempts',
          {
            id: {
              type: DataTypes.UUID,
              allowNull: false,
              primaryKey: true,
            },
            orderId: {
              type: DataTypes.UUID,
              allowNull: false,
              references: {
                model: 'Orders',
                key: 'id',
              },
            },
            amount: {
              type: DataTypes.DECIMAL(12, 2),
              allowNull: false,
            },
            status: {
              type: DataTypes.STRING(50),
              allowNull: false,
            },
            provider: {
              type: DataTypes.STRING,
              allowNull: false,
              defaultValue: 'stub',
            },
            method: {
              type: DataTypes.STRING,
              allowNull: true,
            },
            cardLast4: {
              type: DataTypes.STRING,
              allowNull: true,
            },
            reference: {
              type: DataTypes.STRING,
              allowNull: false,
            },
            failureReason: {
              type: DataTypes.TEXT,
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
