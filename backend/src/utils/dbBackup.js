import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

(() => {
  console.log('Starting database backup...');

  try {
    const BACKUP_DIR = path.join(process.cwd(), '.db_backups');
    const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
    const BACKUP_PATH = path.join(BACKUP_DIR, `backup_${TIMESTAMP}.sql`);

    // Create backup directory
    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    // Build mysqldump command with environment variables
    const command = `mysqldump -h ${process.env.DB_HOST} -u ${process.env.DB_USER} -p'${process.env.DB_PASS}' ${process.env.DB_NAME} > "${BACKUP_PATH}"`;

    // Execute backup
    execSync(command, { stdio: 'inherit' });

    // Verify backup file was created and has content
    const stats = fs.statSync(BACKUP_PATH);
    if (stats.size > 0) {
      console.log(`Backup created successfully!`);
      console.log(`Location: ${BACKUP_PATH}`);
      console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
      throw new Error('Backup file is empty');
    }
  } catch (err) {
    console.error('Backup failed:', err.message);
    process.exit(1);
  }
})();