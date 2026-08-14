import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyMigrations, MigrationError } from '@server/persistence/migrate.ts';

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function tableNames(db: Database.Database): string[] {
  return db
    .prepare<[], { name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    )
    .all()
    .map((row) => row.name);
}

describe('runner de migração', () => {
  it('aplica em banco vazio e cria as tabelas do esquema', () => {
    const db = new Database(':memory:');

    const applied = applyMigrations(db);

    expect(applied).toEqual(['0001_initial.sql']);
    expect(tableNames(db)).toContain('event');
    expect(tableNames(db)).toContain('invitation');
  });

  it('é idempotente: aplicar duas vezes não reaplica nem falha', () => {
    const db = new Database(':memory:');

    const first = applyMigrations(db);
    const second = applyMigrations(db);

    expect(first.length).toBeGreaterThan(0);
    expect(second).toEqual([]);
  });

  it('registra as migrações aplicadas em tabela de controle', () => {
    const db = new Database(':memory:');

    applyMigrations(db);

    const rows = db
      .prepare<[], { name: string }>('SELECT name FROM schema_migration ORDER BY name')
      .all();
    expect(rows.map((r) => r.name)).toEqual(['0001_initial.sql']);
  });

  it('uma migração inválida não deixa aplicação parcial', () => {
    const dir = tempDir('rsvp-migrations-');
    mkdirSync(dir, { recursive: true });
    // Primeira instrução válida, segunda inválida: se não houver transação, a tabela `a`
    // sobreviveria. O contrato é que ela não sobreviva.
    writeFileSync(
      join(dir, '0001_broken.sql'),
      'CREATE TABLE a (id TEXT); CREATE TABLE ;',
      'utf8',
    );
    const db = new Database(':memory:');

    expect(() => applyMigrations(db, dir)).toThrow(MigrationError);
    expect(tableNames(db)).not.toContain('a');

    const applied = db.prepare<[], { name: string }>('SELECT name FROM schema_migration').all();
    expect(applied).toEqual([]);
  });

  it('aplica os arquivos em ordem numérica, não em ordem de leitura do diretório', () => {
    const dir = tempDir('rsvp-migrations-order-');
    writeFileSync(join(dir, '0010_second.sql'), 'CREATE TABLE second (id TEXT);', 'utf8');
    writeFileSync(join(dir, '0002_first.sql'), 'CREATE TABLE first (id TEXT);', 'utf8');
    const db = new Database(':memory:');

    const applied = applyMigrations(db, dir);

    expect(applied).toEqual(['0002_first.sql', '0010_second.sql']);
  });
});
