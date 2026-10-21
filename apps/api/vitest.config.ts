import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Base SQLite dédiée aux tests, recréée à chaque lancement
    env: { DATABASE_URL: 'file:./test.db', NODE_ENV: 'test' },
    globalSetup: ['./test/global-setup.ts'],
    // Une seule base partagée : on évite l'exécution parallèle des fichiers
    fileParallelism: false,
  },
});
