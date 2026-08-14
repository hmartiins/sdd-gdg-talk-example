import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * FR-008 / SC-006: a direção de dependência entre camadas precisa ser VERIFICÁVEL, não
 * apenas documentada. Este teste é a prova de que o mecanismo de verificação funciona — sem
 * ele, `eslint.config.js` poderia parar de fiscalizar e ninguém notaria.
 *
 * Cada caso escreve um arquivo temporário dentro de `src/` (o plugin resolve camadas por
 * caminho) e afirma que o ESLint reporta, ou não, a violação.
 */

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

async function lintSource(relativeDir: string, source: string): Promise<ESLint.LintResult> {
  const dir = join(repoRoot, relativeDir, '__arch_tmp__');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `probe_${Math.random().toString(36).slice(2)}.ts`);
  writeFileSync(file, source, 'utf8');

  try {
    const eslint = new ESLint({ cwd: repoRoot });
    const [result] = await eslint.lintFiles([file]);
    if (!result) throw new Error('ESLint não retornou resultado');
    return result;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function errorsFrom(result: ESLint.LintResult, ruleIdPrefix: string): string[] {
  return result.messages
    .filter((m) => m.severity === 2 && (m.ruleId ?? '').startsWith(ruleIdPrefix))
    .map((m) => m.message);
}

describe('direções de dependência entre camadas', () => {
  it('reprova import de server dentro de domain', async () => {
    const result = await lintSource(
      'src/domain',
      `import { openDatabase } from '../../server/persistence/db.ts';\nexport const x = openDatabase;\n`,
    );

    expect(errorsFrom(result, 'boundaries/')).not.toHaveLength(0);
  });

  it('reprova import de client dentro de domain', async () => {
    const result = await lintSource(
      'src/domain',
      `import { App } from '../../client/App.tsx';\nexport const x = App;\n`,
    );

    expect(errorsFrom(result, 'boundaries/')).not.toHaveLength(0);
  });

  it('reprova import de server dentro de client', async () => {
    const result = await lintSource(
      'src/client',
      `import { buildApp } from '../../server/app.ts';\nexport const x = buildApp;\n`,
    );

    expect(errorsFrom(result, 'boundaries/')).not.toHaveLength(0);
  });

  it('reprova import de domain dentro de client', async () => {
    const result = await lintSource(
      'src/client',
      `import { isRsvpOpen } from '../../domain/rsvp/invitation.ts';\nexport const x = isRsvpOpen;\n`,
    );

    expect(errorsFrom(result, 'boundaries/')).not.toHaveLength(0);
  });

  it('reprova uso de node:* dentro de domain', async () => {
    const result = await lintSource(
      'src/domain',
      `import { readFileSync } from 'node:fs';\nexport const x = readFileSync;\n`,
    );

    expect(errorsFrom(result, 'no-restricted-imports')).not.toHaveLength(0);
  });

  it('reprova console.* dentro de server', async () => {
    const result = await lintSource('src/server', `export const x = () => console.log('oi');\n`);

    expect(errorsFrom(result, 'no-console')).not.toHaveLength(0);
  });

  it('permite domain → shared', async () => {
    const result = await lintSource(
      'src/domain',
      `import type { RsvpStatus } from '../../shared/contracts/invitation.ts';\nexport type X = RsvpStatus;\n`,
    );

    expect(errorsFrom(result, 'boundaries/')).toHaveLength(0);
  });

  it('permite server → domain', async () => {
    const result = await lintSource(
      'src/server',
      `import { isRsvpOpen } from '../domain/rsvp/invitation.ts';\nexport const x = isRsvpOpen;\n`,
    );

    expect(errorsFrom(result, 'boundaries/')).toHaveLength(0);
  });

  it('permite client → shared', async () => {
    const result = await lintSource(
      'src/client',
      `import type { InvitationView } from '../shared/contracts/invitation.ts';\nexport type X = InvitationView;\n`,
    );

    expect(errorsFrom(result, 'boundaries/')).toHaveLength(0);
  });
});

describe('o código-fonte real respeita as camadas', () => {
  it('não há nenhuma violação de fronteira em src/', async () => {
    const eslint = new ESLint({ cwd: repoRoot });
    const results = await eslint.lintFiles(['src/**/*.{ts,tsx}']);

    const violations = results.flatMap((r) =>
      r.messages
        .filter((m) => m.severity === 2 && (m.ruleId ?? '').startsWith('boundaries/'))
        .map((m) => `${r.filePath}: ${m.message}`),
    );

    expect(violations).toEqual([]);
  });
});
