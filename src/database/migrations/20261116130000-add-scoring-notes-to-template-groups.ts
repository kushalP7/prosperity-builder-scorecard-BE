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
 * Staff-only scoring rule text, separate from client-facing label.
 * Also splits existing labels that embedded "If 'Data'..." formulas into label + scoringNotes.
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

      if (names.includes('TemplateGroups')) {
        await addColumnIfMissing(
          queryInterface,
          'TemplateGroups',
          'scoringNotes',
          { type: DataTypes.TEXT, allowNull: true },
          transaction,
        );

        // Split formula text out of labels into scoringNotes (idempotent-ish)
        await queryInterface.sequelize.query(
          `
          UPDATE "TemplateGroups"
          SET
            "scoringNotes" = CASE
              WHEN ("scoringNotes" IS NULL OR TRIM("scoringNotes") = '')
                AND position('If' in "label") > 0
              THEN TRIM(substring("label" from position('If' in "label")))
              ELSE "scoringNotes"
            END,
            "label" = CASE
              WHEN position('If' in "label") > 0
              THEN TRIM(BOTH ' -–—;,' FROM substring("label" from 1 for position('If' in "label") - 1))
              ELSE "label"
            END
          WHERE position('If' in "label") > 0
            AND length(TRIM(substring("label" from 1 for position('If' in "label") - 1))) > 0
          `,
          { transaction },
        );
      }

      if (names.includes('TemplateCategories')) {
        await addColumnIfMissing(
          queryInterface,
          'TemplateCategories',
          'scoringNotes',
          { type: DataTypes.TEXT, allowNull: true },
          transaction,
        );

        await queryInterface.sequelize.query(
          `
          UPDATE "TemplateCategories"
          SET
            "scoringNotes" = CASE
              WHEN ("scoringNotes" IS NULL OR TRIM("scoringNotes") = '')
                AND position('If' in "label") > 0
              THEN TRIM(substring("label" from position('If' in "label")))
              ELSE "scoringNotes"
            END,
            "label" = CASE
              WHEN position('If' in "label") > 0
              THEN TRIM(BOTH ' -–—;,' FROM substring("label" from 1 for position('If' in "label") - 1))
              ELSE "label"
            END
          WHERE position('If' in "label") > 0
            AND length(TRIM(substring("label" from 1 for position('If' in "label") - 1))) > 0
          `,
          { transaction },
        );
      }

      await transaction.commit();
    } catch (err) {
      if (transaction) await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    let transaction: Transaction | undefined;
    try {
      transaction = await queryInterface.sequelize.transaction();
      const tables = await queryInterface.showAllTables();
      const names = tables.map((t: any) =>
        typeof t === 'string' ? t : t.tableName || t.table_name || String(t),
      );

      if (names.includes('TemplateGroups')) {
        const desc = await queryInterface.describeTable('TemplateGroups', { transaction } as any);
        if ('scoringNotes' in desc) {
          await queryInterface.removeColumn('TemplateGroups', 'scoringNotes', { transaction });
        }
      }
      if (names.includes('TemplateCategories')) {
        const desc = await queryInterface.describeTable('TemplateCategories', { transaction } as any);
        if ('scoringNotes' in desc) {
          await queryInterface.removeColumn('TemplateCategories', 'scoringNotes', { transaction });
        }
      }

      await transaction.commit();
    } catch (err) {
      if (transaction) await transaction.rollback();
      throw err;
    }
  },
};
