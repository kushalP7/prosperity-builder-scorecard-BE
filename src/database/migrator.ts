import * as fs from 'fs';
import * as path from 'path';
import {
  buildUmzug,
  createMigratorSequelize,
  runPendingMigrations,
} from './run-migrations';

function loadEnvFile(file: string): void {
  const full = path.resolve(process.cwd(), file);
  if (!fs.existsSync(full)) {
    throw new Error(`Env file not found: ${full}`);
  }
  const raw = fs.readFileSync(full, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    // strip optional surrounding quotes
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

const envArg = process.argv.find((a) => a.startsWith('--env='));
const envFile =
  (envArg && envArg.slice('--env='.length)) ||
  process.env.MIGRATE_ENV_FILE ||
  '.env';
loadEnvFile(envFile);
process.argv = process.argv.filter((a) => !a.startsWith('--env='));

if (!process.env.DB_DATABASE || !process.env.DB_HOST || !process.env.DB_USERNAME) {
  console.error(
    `Missing DB config after loading ${envFile}. Need DB_HOST, DB_USERNAME, DB_DATABASE.`,
  );
  console.error({
    DB_HOST: process.env.DB_HOST,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_DATABASE: process.env.DB_DATABASE,
  });
  process.exit(1);
}

async function main() {
  const cmd = process.argv[2] || 'status';
  console.log(
    `Migrator DB=${process.env.DB_DATABASE} host=${process.env.DB_HOST}:${process.env.DB_PORT} user=${process.env.DB_USERNAME} envFile=${envFile}`,
  );

  const sequelize = createMigratorSequelize();
  const { umzug, storage } = buildUmzug(sequelize);

  try {
    await sequelize.authenticate();
    const dbName = (await sequelize.query('SELECT current_database() AS db'))[0] as any;
    console.log(`Connected to database: ${dbName?.[0]?.db || dbName?.db || '?'}`);

    if (cmd === 'up' || cmd === 'migrate') {
      const result = await runPendingMigrations(sequelize);
      console.log(
        result.applied.length
          ? `Applied ${result.applied.length} migration(s): ${result.applied.join(', ')}`
          : 'No pending migrations.',
      );
    } else if (cmd === 'down') {
      const reverted = await umzug.down();
      console.log(
        reverted.length
          ? `Reverted ${reverted.length}: ${reverted.map((m) => m.name).join(', ')}`
          : 'Nothing to revert.',
      );
    } else if (cmd === 'status') {
      const executed = await umzug.executed();
      const pending = await umzug.pending();
      console.log('Executed:', executed.map((m) => m.name));
      console.log('Pending:', pending.map((m) => m.name));
    } else if (cmd === 'stamp') {
      const pending = await umzug.pending();
      if (!pending.length) {
        console.log('Nothing to stamp.');
      } else {
        for (const m of pending) {
          await storage.logMigration({ name: m.name });
          console.log('Stamped:', m.name);
        }
        console.log(`Stamped ${pending.length} migration(s) into SequelizeMeta.`);
      }
    } else if (cmd === 'restamp') {
      await sequelize.getQueryInterface().bulkDelete('SequelizeMeta', {});
      console.log('Cleared SequelizeMeta.');
      const pending = await umzug.pending();
      for (const m of pending) {
        await storage.logMigration({ name: m.name });
        console.log('Stamped:', m.name);
      }
      console.log(`Restamped ${pending.length} migration(s).`);
    } else {
      console.error('Usage: migrator.ts <up|down|status|stamp|restamp>');
      process.exit(1);
    }
  } finally {
    await sequelize.close();
  }
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
