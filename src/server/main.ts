import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { buildApp } from './app.ts';
import { openDatabase } from './persistence/db.ts';

/**
 * Entrypoint. Um único processo serve API e, em produção, o bundle do cliente — é o que
 * torna `npm start` um comando só, sem serviço externo (FR-001).
 */

const port = Number(process.env['PORT'] ?? 3000);
const host = process.env['HOST'] ?? '127.0.0.1';
const databaseFile = process.env['DATABASE_FILE'] ?? './data/rsvp.sqlite';

if (databaseFile !== ':memory:') {
  mkdirSync(dirname(resolve(databaseFile)), { recursive: true });
}

// Migrações pendentes são aplicadas na abertura: um clone novo chega a um banco utilizável
// sem passo manual (FR-001, caso de borda de banco não inicializado).
const db = openDatabase({ file: databaseFile });

const distDir = fileURLToPath(new URL('../../dist', import.meta.url));
const app = await buildApp({
  db,
  ...(existsSync(distDir) ? { clientDist: distDir } : {}),
});

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, 'shutting_down');
  await app.close();
  db.close();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error({ err: error }, 'failed_to_start');
  process.exit(1);
}
