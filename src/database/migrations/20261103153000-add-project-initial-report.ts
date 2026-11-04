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
 * Auto-generated Initial Scorecard PDF fields on Projects (publish-time).
 * Existing certifiedReport* columns remain the Detailed Report (admin upload).
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
      if (!names.includes('Projects')) {
        await transaction.commit();
        return;
      }

      await addColumnIfMissing(
        queryInterface,
        'Projects',
        'initialReportUrl',
        { type: DataTypes.TEXT, allowNull: true },
        transaction,
      );
      await addColumnIfMissing(
        queryInterface,
        'Projects',
        'initialReportPublicId',
        { type: DataTypes.STRING, allowNull: true },
        transaction,
      );
      await addColumnIfMissing(
        queryInterface,
        'Projects',
        'initialReportFileName',
        { type: DataTypes.STRING, allowNull: true },
        transaction,
      );
      await addColumnIfMissing(
        queryInterface,
        'Projects',
        'initialReportGeneratedAt',
        { type: DataTypes.DATE, allowNull: true },
        transaction,
      );

      await transaction.commit();
    } catch (err) {
      if (transaction) await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const desc = await queryInterface.describeTable('Projects');
    for (const col of [
      'initialReportUrl',
      'initialReportPublicId',
      'initialReportFileName',
      'initialReportGeneratedAt',
    ]) {
      if (col in desc) {
        await queryInterface.removeColumn('Projects', col);
      }
    }
  },
};
