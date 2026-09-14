import { pool } from './config.js';
import { ensureDatabaseConnection, runMigrations } from './server.js';

try {
  const connected = await ensureDatabaseConnection();
  if (!connected) {
    throw new Error('Database tidak dapat diakses');
  }

  await runMigrations();
  console.log('✅ Migration completed');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}

