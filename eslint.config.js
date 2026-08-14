import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';

/**
 * Configuração de lint. Além do óbvio, aqui moram DUAS regras de governança que a
 * constituição exige serem verificáveis, não apenas documentadas:
 *
 *  1. Direções de dependência entre camadas (FR-008, Princípio V).
 *  2. Proibição de `console.*` no servidor, que força todo log pelo ponto único com redação
 *     de PII (FR-022, Princípio III).
 */

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      '.playwright/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*.{ts,tsx}'],
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/domain/**' },
        { type: 'server', pattern: 'src/server/**' },
        { type: 'client', pattern: 'src/client/**' },
        { type: 'shared', pattern: 'src/shared/**' },
      ],
    },
    rules: {
      // A aresta proibida mais importante é `domain → server`: se ela existir, as regras de
      // RSVP deixam de ser testáveis sem banco, e o Princípio II perde o sentido.
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'domain', allow: ['domain', 'shared'] },
            { from: 'server', allow: ['server', 'domain', 'shared'] },
            { from: 'client', allow: ['client', 'shared'] },
            { from: 'shared', allow: ['shared'] },
          ],
        },
      ],
      'boundaries/no-unknown': 'error',
      'boundaries/no-unknown-files': 'error',
    },
  },

  {
    // O domínio é puro: nada de I/O, nada de framework. Sem isto, um `node:fs` entraria por
    // acidente e só seria notado quando um teste de unidade ficasse lento.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['node:*'], message: 'O domínio não pode depender de APIs do Node.' },
            { group: ['better-sqlite3'], message: 'O domínio não conhece o banco.' },
            { group: ['fastify', 'fastify/*'], message: 'O domínio não conhece HTTP.' },
            { group: ['react', 'react-dom', 'react/*'], message: 'O domínio não conhece UI.' },
          ],
        },
      ],
    },
  },

  {
    // FR-022: todo log passa pelo ponto único com redação; `console` fura essa garantia.
    files: ['src/server/**/*.ts'],
    ignores: ['src/server/logging/**'],
    rules: {
      'no-console': 'error',
    },
  },

  {
    files: ['src/client/**/*.{ts,tsx}'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
    },
    languageOptions: {
      globals: { window: 'readonly', document: 'readonly', fetch: 'readonly' },
    },
  },

  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      // Os testes acessam propriedades inexistentes de propósito, para provar que não
      // existem (ex.: `findAll` no repositório).
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
);
