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
 * Persist staff-triggered payment reminder count on Orders.
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
        await transaction.commit();
        return;
      }

      await addColumnIfMissing(
        queryInterface,
        'Orders',
        'reminderSentCount',
        {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        transaction,
      );

      await transaction.commit();
    } catch (err) {
      if (transaction) await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const desc = await queryInterface.describeTable('Orders');
    if ('reminderSentCount' in desc) {
      await queryInterface.removeColumn('Orders', 'reminderSentCount');
    }
  },
};
