import Database from 'better-sqlite3';
import { applyMigrations } from './migrate.ts';

export type Db = Database.Database;

export interface OpenDatabaseOptions {
  /** Caminho do arquivo SQLite, ou `:memory:` em testes. */
  readonly file: string;
  /** Aplicar migrações pendentes na abertura. Padrão: `true`. */
  readonly migrate?: boolean;
}

/**
 * Abre o banco com as garantias que a constituição exige do armazenamento:
 *
 * - `journal_mode = WAL`: leituras não bloqueiam a escrita de um RSVP.
 * - `synchronous = FULL`: um RSVP confirmado sobrevive a queda de energia. Escolha
 *   deliberada de durabilidade sobre throughput — a constituição diz que perder um RSVP
 *   submetido nunca é aceitável, e o volume deste projeto não justifica o contrário.
 * - `foreign_keys = ON`: o SQLite não as aplica por padrão; sem isto, `event_id` órfão
 *   passaria despercebido.
 * - `busy_timeout`: espera em vez de falhar imediatamente sob escrita concorrente.
 */
export function openDatabase({ file, migrate = true }: OpenDatabaseOptions): Db {
  const db = new Database(file);

  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = FULL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  if (migrate) {
    applyMigrations(db);
  }

  return db;
}

/** Verificação usada por `GET /api/health`. Não expõe caminho de arquivo nem versão. */
export function isDatabaseHealthy(db: Db): boolean {
  try {
    db.prepare('SELECT 1 FROM schema_migration LIMIT 1').get();
    return true;
  } catch {
    return false;
  }
}
