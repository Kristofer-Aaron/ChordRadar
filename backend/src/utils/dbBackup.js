import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import mysqldump from 'mysqldump';

(async () => {
  console.log('ENV CHECK:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    db: process.env.DB_NAME,
  });

  try {
    const BACKUP_DIR = path.join(process.cwd(), '.db_backups');
    const BACKUP_PATH = path.join(BACKUP_DIR, `backup_${Date.now()}.sql`);

    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    await mysqldump({
      connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
      },
      dumpToFile: BACKUP_PATH,
    });

    console.log(`✅ Backup created: ${BACKUP_PATH}`);
  } catch (err) {
    console.error('❌ Backup failed:', err);
  }
})();