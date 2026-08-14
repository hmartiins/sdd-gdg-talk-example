import { describe, expect, it } from 'vitest';
import { execFileSync, execSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * SC-007: o portão precisa REPROVAR. Um portão que só sabe aprovar não é um portão.
 *
 * Cada caso copia o repositório para um diretório temporário, injeta UMA violação, roda a
 * etapa correspondente do `verify` e afirma saída ≠ 0 com a etapa certa nomeada.
 *
 * Este projeto está DELIBERADAMENTE fora de `npm run verify`: ele executa o próprio
 * `verify`, e incluí-lo criaria recursão infinita. Roda sob demanda com `npm run test:gate`.
 */

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

interface Attempt {
  readonly status: number;
  readonly output: string;
}

function withCorruptedCopy(inject: (dir: string) => void, script: string): Attempt {
  const dir = mkdtempSync(join(tmpdir(), 'rsvp-gate-'));

  try {
    for (const entry of [
      'src',
      'tests',
      'db',
      'package.json',
      'tsconfig.json',
      'tsconfig.node.json',
      'eslint.config.js',
      '.prettierrc',
      '.prettierignore',
      'vitest.config.ts',
      'index.html',
    ]) {
      cpSync(join(repoRoot, entry), join(dir, entry), { recursive: true });
    }
    // Reusar node_modules por symlink: instalar de novo levaria minutos por caso.
    execSync(`ln -s ${JSON.stringify(join(repoRoot, 'node_modules'))} ${JSON.stringify(join(dir, 'node_modules'))}`);

    inject(dir);

    try {
      const output = execFileSync('npm', ['run', script], {
        cwd: dir,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      return { status: 0, output };
    } catch (error) {
      const err = error as { status?: number; stdout?: string; stderr?: string };
      return {
        status: err.status ?? 1,
        output: `${err.stdout ?? ''}${err.stderr ?? ''}`,
      };
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('o portão reprova cada tipo de violação', () => {
  it('reprova formatação fora do padrão', () => {
    const attempt = withCorruptedCopy((dir) => {
      writeFileSync(
        join(dir, 'src/shared/contracts/badformat.ts'),
        'export   const    x=1\n',
        'utf8',
      );
    }, 'format:check');

    expect(attempt.status).not.toBe(0);
    expect(attempt.output).toContain('badformat.ts');
  });

  it('reprova violação de fronteira entre camadas', () => {
    const attempt = withCorruptedCopy((dir) => {
      appendFileSync(
        join(dir, 'src/domain/rsvp/invitation.ts'),
        `\nimport { openDatabase } from '../../server/persistence/db.ts';\nexport const leak = openDatabase;\n`,
        'utf8',
      );
    }, 'lint');

    expect(attempt.status).not.toBe(0);
    expect(attempt.output).toMatch(/boundaries|no-restricted-imports/);
  });

  it('reprova erro de tipo', () => {
    const attempt = withCorruptedCopy((dir) => {
      writeFileSync(
        join(dir, 'src/shared/contracts/badtype.ts'),
        'export const n: number = "isto não é um número";\n',
        'utf8',
      );
    }, 'typecheck');

    expect(attempt.status).not.toBe(0);
    expect(attempt.output).toContain('badtype.ts');
  });

  it('reprova asserção invertida em teste de unidade', () => {
    const attempt = withCorruptedCopy((dir) => {
      writeFileSync(
        join(dir, 'tests/unit/domain/deliberate-failure.test.ts'),
        `import { describe, expect, it } from 'vitest';\n\ndescribe('falha deliberada', () => {\n  it('falha', () => {\n    expect(1).toBe(2);\n  });\n});\n`,
        'utf8',
      );
    }, 'test:unit');

    expect(attempt.status).not.toBe(0);
    expect(attempt.output).toContain('deliberate-failure');
  });

  it('reprova console.* no servidor', () => {
    const attempt = withCorruptedCopy((dir) => {
      appendFileSync(
        join(dir, 'src/server/http/health.route.ts'),
        `\nexport const noisy = () => console.log('vazamento em potencial');\n`,
        'utf8',
      );
    }, 'lint');

    expect(attempt.status).not.toBe(0);
    expect(attempt.output).toContain('no-console');
  });
});

describe('o CI executa exatamente o mesmo script do local', () => {
  it('o workflow não define etapas de verificação próprias', () => {
    const workflow = execFileSync('cat', ['.github/workflows/verify.yml'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    // Se o CI tivesse a própria lista de etapas, ele poderia aprovar o que o local reprova.
    expect(workflow).toContain('npm run verify');
    expect(workflow).not.toMatch(/run:\s*npm run (lint|typecheck|test:unit|format:check)\b/);
  });
});
