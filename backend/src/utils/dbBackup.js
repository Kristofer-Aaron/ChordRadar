import mysqldump from 'mysqldump';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
    try {
        const BACKUP_PATH = path.join(__dirname, '../../.db_backups', `backup_${Date.now()}.sql`);

        await mysqldump({
            connection: {
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASS,
                database: process.env.DB_NAME,
            },
            dumpToFile: BACKUP_PATH,
        });

        console.log(`Backup completed successfully! File saved at: ${BACKUP_PATH}`);
    } catch (error) {
        console.error('Backup failed:', error);
    }
})();