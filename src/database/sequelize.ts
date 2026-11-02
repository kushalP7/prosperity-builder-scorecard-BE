import { Sequelize } from 'sequelize';

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
