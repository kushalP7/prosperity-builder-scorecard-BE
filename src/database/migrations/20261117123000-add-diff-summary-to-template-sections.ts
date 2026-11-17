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

export default {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tables = await queryInterface.showAllTables();
      const names = tables.map((t: any) =>
        typeof t === 'string' ? t : t.tableName || t.table_name || String(t),
      );

      if (names.includes('TemplateSections')) {
        await addColumnIfMissing(
          queryInterface,
          'TemplateSections',
          'diffSummary',
          { type: DataTypes.JSONB, allowNull: true },
          transaction,
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const desc = await queryInterface.describeTable('TemplateSections', { transaction } as any);
      if ('diffSummary' in desc) {
        await queryInterface.removeColumn('TemplateSections', 'diffSummary', { transaction });
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
