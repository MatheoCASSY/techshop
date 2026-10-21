import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Base jetable propre aux tests (chemin relatif au schéma Prisma) : jamais la base de dev
const TEST_DB_URL = 'file:./test.db';
const TEST_DB_PATH = fileURLToPath(new URL('../prisma/test.db', import.meta.url));

export default function setup() {
  // On repart d'une base vierge en supprimant le fichier plutôt qu'avec --force-reset
  rmSync(TEST_DB_PATH, { force: true });
  rmSync(`${TEST_DB_PATH}-journal`, { force: true });
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
  });
}
