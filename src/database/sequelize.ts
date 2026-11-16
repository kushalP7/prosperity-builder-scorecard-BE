import { Sequelize } from 'sequelize';

/**
 * SSL is off unless the host is Neon or DB_SSL=true.
 * Local Postgres and the EC2 tunnel do not accept SSL.
 * Neon rejects plain connections with "connection is insecure (try using `sslmode=require`)".
 */
export function postgresDialectOptions(host = process.env.DB_HOST): {
  ssl?: { require: true; rejectUnauthorized: true };
} {
  const flag = String(process.env.DB_SSL ?? '').trim().toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'disable') return {};
  const explicitlyOn = flag === 'true' || flag === '1' || flag === 'require';
  const neonHost = (host ?? '').includes('neon.tech');
  if (!explicitlyOn && !neonHost) return {};
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
