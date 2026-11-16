import { Sequelize } from 'sequelize';

/**
 * Neon (and other hosted Postgres) rejects non-SSL clients with
 * "connection is insecure (try using `sslmode=require`)".
 * DB_SSL=true enables it. DB_SSL=false disables it.
 * When unset, callers choose the default (app on, migrations off unless the host is Neon).
 */
export function postgresDialectOptions(defaultOn = false): {
  ssl?: { require: true; rejectUnauthorized: true };
} {
  const flag = String(process.env.DB_SSL ?? '').trim().toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'disable') return {};
  const explicitlyOn = flag === 'true' || flag === '1' || flag === 'require';
  const neonHost = (process.env.DB_HOST ?? '').includes('neon.tech');
  if (!explicitlyOn && !neonHost && !defaultOn) return {};
  return {
    ssl: {
      require: true,
      rejectUnauthorized: true,
    },
  };
}

/**
 * Shared Sequelize for migration transactions.
 * Lazy: created on first use so migrator can load .env first.
 */
let instance: Sequelize | null = null;

export function getMigrationSequelize(): Sequelize {
  if (!instance) {
    if (!process.env.DB_DATABASE || !process.env.DB_USERNAME) {
      throw new Error(
        'Migration sequelize: DB_DATABASE / DB_USERNAME missing. Load .env before running migrations.',
      );
    }
    instance = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      dialectOptions: postgresDialectOptions(),
      logging: false,
    });
  }
  return instance;
}

/** @deprecated Prefer getMigrationSequelize() or queryInterface.sequelize */
export const sequelize = new Proxy({} as Sequelize, {
  get(_target, prop, receiver) {
    const real = getMigrationSequelize();
    const value = Reflect.get(real, prop, real);
    return typeof value === 'function' ? value.bind(real) : value;
  },
});

export async function closeMigrationSequelize(): Promise<void> {
  if (instance) {
    await instance.close();
    instance = null;
  }
}
