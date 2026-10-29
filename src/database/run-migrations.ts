import * as path from 'path';
import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize as migrationFileSequelize } from './sequelize';

export type RunMigrationsResult = {
  applied: string[];
  pendingBefore: number;
};

function buildUmzug(sequelize: Sequelize) {
  const isTsRuntime = __filename.endsWith('.ts');
  const migrationsGlob = path
    .join(__dirname, 'migrations', isTsRuntime ? '*.ts' : '*.js')
    .replace(/\\/g, '/');

  const storage = new SequelizeStorage({ sequelize, tableName: 'SequelizeMeta' });

  const umzug = new Umzug({
    migrations: {
      glob: migrationsGlob,
      resolve: ({ name, path: migrationPath, context }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const loaded = require(migrationPath as string);
        const migration = loaded.default || loaded;
        return {
          name: name.replace(/\.(ts|js)$/i, ''),
          up: async () => {
            if (typeof migration.up !== 'function') {
              throw new Error(`Migration ${name} has no up()`);
            }
            return migration.up(context);
          },
          down: async () => {
            if (typeof migration.down === 'function') {
              return migration.down(context);
            }
          },
        };
      },
    },
    context: sequelize.getQueryInterface(),
    storage,
    logger: undefined,
  });

  return { umzug, storage };
}

export function createMigratorSequelize(): Sequelize {
  return new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    logging: false,
  });
}

/** Apply all pending migrations (idempotent). */
export async function runPendingMigrations(
  existing?: Sequelize,
): Promise<RunMigrationsResult> {
  const ownsConnection = !existing;
  const sequelize = existing || createMigratorSequelize();
  const { umzug } = buildUmzug(sequelize);

  try {
    await sequelize.authenticate();
    const pending = await umzug.pending();
    const executed = await umzug.up();
    return {
      applied: executed.map((m) => m.name),
      pendingBefore: pending.length,
    };
  } finally {
    // Migration files use a shared sequelize for transactions — close its pool too
    try {
      await migrationFileSequelize.close();
    } catch {
      /* ignore */
    }
    if (ownsConnection) {
      await sequelize.close();
    }
  }
}

export { buildUmzug };
