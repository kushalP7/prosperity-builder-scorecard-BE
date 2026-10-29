import { Sequelize } from 'sequelize';

/**
 * Shared Sequelize instance for migration files (transactions).
 * Env must already be loaded by migrator.ts (or Nest ConfigModule).
 */
export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  logging: false,
});
