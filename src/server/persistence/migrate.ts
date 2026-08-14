import type Database from 'better-sqlite3';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * Runner de migração deliberadamente pequeno (research.md R-004 / plan.md Complexity
 * Tracking): arquivos SQL numerados, aplicados em ordem, dentro de transação, com registro
 * do que já foi aplicado. Sem CLI própria, sem rollback automático — o esquema é pequeno e
 * nenhum requisito atual pede isso.
 */

export class MigrationError extends Error {
  constructor(
    readonly migration: string,
    cause: unknown,
  ) {
    super(`Falha ao aplicar a migração ${migration}`, { cause });
    this.name = 'MigrationError';
  }
}

export const DEFAULT_MIGRATIONS_DIR = fileURLToPath(
  new URL('../../../db/migrations', import.meta.url),
);

function ensureControlTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migration (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);
}

function pendingMigrations(db: Database.Database, dir: string): string[] {
  const onDisk = readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, 'en'));

  const applied = new Set(
    db
      .prepare<[], { name: string }>('SELECT name FROM schema_migration')
      .all()
      .map((row) => row.name),
  );

  return onDisk.filter((name) => !applied.has(name));
}

/**
 * Aplica as migrações pendentes e devolve os nomes das que foram aplicadas nesta chamada.
 * Chamar novamente sem migrações novas devolve lista vazia.
 *
 * Cada migração roda em sua própria transação junto com a inserção na tabela de controle:
 * uma migração que falha no meio não deixa nem esquema parcial nem registro de aplicação.
 */
export function applyMigrations(
  db: Database.Database,
  dir: string = DEFAULT_MIGRATIONS_DIR,
): string[] {
  ensureControlTable(db);

  const applied: string[] = [];

  for (const name of pendingMigrations(db, dir)) {
    const sql = readFileSync(join(dir, name), 'utf8');

    const run = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migration (name, applied_at) VALUES (?, ?)').run(
        name,
        new Date().toISOString(),
      );
    });

    try {
      run();
    } catch (cause) {
      throw new MigrationError(name, cause);
    }

    applied.push(name);
  }

  return applied;
}
