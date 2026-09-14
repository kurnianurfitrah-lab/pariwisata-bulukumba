import fs from 'fs';
import path from 'path';
import { env } from '../environment.js';
import { pool, query } from '../config.js';

const shouldDelete = process.argv.includes('--delete');

function getReferencedFilename(value) {
  if (!value?.startsWith('/uploads/')) return null;
  return value.slice('/uploads/'.length);
}

try {
  const galleryRows = await query('SELECT gambar AS image_reference FROM galeri');
  const eventRows = await query('SELECT gambar_event AS image_reference FROM `event`');
  const referencedFiles = new Set(
    [...galleryRows, ...eventRows]
      .map((row) => getReferencedFilename(row.image_reference))
      .filter(Boolean)
  );

  const diskEntries = await fs.promises.readdir(env.UPLOAD_DIR, { withFileTypes: true });
  const orphanFiles = diskEntries
    .filter((entry) => entry.isFile() && !referencedFiles.has(entry.name))
    .map((entry) => entry.name);

  if (!orphanFiles.length) {
    console.log('✅ No orphan uploads found');
  } else if (!shouldDelete) {
    console.log(`⚠️  Found ${orphanFiles.length} orphan upload(s):`);
    orphanFiles.forEach((filename) => console.log(`- ${filename}`));
    console.log('Run `npm run uploads:cleanup:delete` to remove them.');
  } else {
    for (const filename of orphanFiles) {
      await fs.promises.unlink(path.join(env.UPLOAD_DIR, filename));
    }
    console.log(`✅ Removed ${orphanFiles.length} orphan upload(s)`);
  }
} catch (error) {
  console.error('❌ Upload cleanup failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}

