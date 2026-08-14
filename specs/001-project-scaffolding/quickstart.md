# Quickstart — Validação da Estrutura Inicial

**Feature**: `001-project-scaffolding` | **Date**: 2026-08-13

Este é o roteiro de validação: executá-lo do início ao fim prova que a estrutura entrega o
que a [spec.md](./spec.md) exige. Cada cenário aponta o critério de sucesso que verifica.

Não há código de implementação aqui — isso pertence a `tasks.md` e à fase de implementação.

## Pré-requisitos

- Node.js 22 LTS (a versão exata está em `.nvmrc`; com `nvm`, basta `nvm use`)
- npm 10+
- Nenhum banco, container, credencial ou serviço de nuvem

---

## Cenário 1 — Do clone à aplicação rodando

**Verifica**: US1 · FR-001, FR-002, FR-003 · SC-001, SC-002

```bash
git clone <repo> && cd rsvp_example
nvm use          # falha de forma legível se a versão do Node não bater
npm install
npm run dev
```

**Esperado**

- `npm install` conclui sem erro e sem passo manual não documentado.
- `npm run dev` sobe um processo, aplica as migrações pendentes automaticamente e imprime a
  URL local.
- Abrir a URL exibe a página inicial.
- `curl localhost:<porta>/api/health` retorna `{"status":"ok",...}`.
- Do clone até este ponto: menos de 10 minutos (SC-001).

**Teste negativo de versão**: com uma versão de Node diferente da exigida, `npm install`
falha citando a versão esperada — não com erro obscuro em tempo de execução (FR-002).

---

## Cenário 2 — Recarregamento automático

**Verifica**: US1 · FR-004

Com `npm run dev` rodando, edite um texto visível em `src/client/pages/InvitationPage.tsx`
e salve.

**Esperado**: o navegador reflete a mudança sem reinício manual do processo.

---

## Cenário 3 — O ciclo test-first funciona

**Verifica**: US2 · FR-011, FR-013, FR-015 · SC-003, SC-004 · Princípio I

```bash
npm run test:unit        # domínio puro
npm run test:contract    # HTTP + SQLite real
npm run test:e2e         # navegador + servidor + banco reais
npm test                 # todos
```

**Esperado**

- Cada comando roda sem configuração adicional e passa.
- Existe ao menos um teste de cada nível já na estrutura (SC-004).
- `npm run test:unit` conclui em menos de 30s; a suíte completa em menos de 5min (SC-003).
- `npm run test:unit -- tests/unit/domain/response.test.ts` roda só aquele arquivo (FR-015).
- `npm run test:unit -- --watch` reexecuta ao salvar — é o que torna o ciclo
  Red-Green-Refactor praticável.

**Teste negativo (o mais importante deste roteiro)**: adicione um teste que falhe de
propósito.

```bash
npm run test:unit; echo "exit=$?"
```

**Esperado**: `exit` diferente de zero, com arquivo e linha da falha nomeados. Um portão que
não sabe reprovar não é um portão.

---

## Cenário 4 — Testes E2E rodam contra armazenamento real e isolado

**Verifica**: US2 · FR-012 · Princípio II

```bash
npm run test:e2e
```

**Esperado**

- A suíte sobe um servidor real e usa um arquivo SQLite temporário por worker.
- Nenhum duplo de teste substitui a camada de persistência.
- Interromper a execução (`Ctrl+C`) no meio e reexecutar produz o mesmo resultado — o banco
  de teste é descartável, e nenhuma execução herda dado sujo da anterior.
- O banco de desenvolvimento não é tocado pelos testes.

---

## Cenário 5 — Cada coisa tem seu lugar, e o lint prova

**Verifica**: US3 · FR-005 a FR-008 · SC-005, SC-006

Leia `docs/architecture.md` e localize onde vão: uma tela de convidado, uma regra de RSVP e
um acesso a dados. As arestas permitidas são
`client → shared`, `server → domain|shared`, `domain → shared`, `shared → nada`.

**Teste negativo**: adicione, em qualquer arquivo de `src/domain/`, um import de
`src/server/persistence/db` (ou de `node:fs`).

```bash
npm run lint; echo "exit=$?"
```

**Esperado**: `exit` diferente de zero, com a violação de camada nomeada explicitamente
(SC-006). Remova o import e o lint volta a passar.

---

## Cenário 6 — Portão único de verificação

**Verifica**: US4 · FR-016, FR-017 · SC-007

```bash
npm run verify
```

Executa, nesta ordem: `format:check` → `lint` → `typecheck` → `test:unit` → `test:contract`
→ `test:e2e`.

**Esperado**

- Em estado íntegro: sucesso, com cada etapa reportada.
- O CI executa **este mesmo script**, sem lista própria de etapas (SC-007).

**Testes negativos** — introduza uma violação de cada vez e confirme que `verify` reprova
identificando a etapa e o arquivo:

| Violação | Etapa que deve reprovar |
|---|---|
| Indentação fora do padrão | `format:check` |
| Variável não usada / import proibido entre camadas | `lint` |
| Atribuir `string` a um campo `number` | `typecheck` |
| Asserção invertida em um teste | `test:*` |

---

## Cenário 7 — Cobertura

**Verifica**: FR-014

```bash
npm run test:coverage
```

**Esperado**: relatório consultável no terminal e em `coverage/`, com as camadas
identificáveis separadamente.

---

## Cenário 8 — Acessibilidade das páginas de convidado

**Verifica**: US1/US3 · FR-018 · Princípio IV

```bash
npm run test:e2e -- tests/e2e/accessibility.spec.ts
```

**Esperado**

- axe-core roda contra a página de convite renderizada, em viewport de 320px.
- Nenhuma violação de nível A ou AA; qualquer uma reprova a suíte.

**Verificação manual** (não automatizável, e por isso item de revisão): navegue a página
inteira só pelo teclado — todo elemento interativo é alcançável, a ordem de foco é
previsível e o foco é sempre visível.

---

## Cenário 9 — Nenhum dado pessoal em log

**Verifica**: US5 · FR-022, FR-023 · SC-008, SC-009 · Princípio III

```bash
npm run test:contract -- tests/contract/logging-privacy.contract.test.ts
```

**Esperado**: o teste exercita o fluxo de convite com nome e e-mail conhecidos e falha se
qualquer um desses valores — ou o token — aparecer na saída de log.

**Teste negativo**: registre deliberadamente `logger.info({ guestEmail })` em um caminho do
servidor. O teste deve reprovar.

Confira também que `docs/data-privacy.md` declara propósito e limite de retenção para 100%
dos campos pessoais de [data-model.md](./data-model.md) (SC-009).

---

## Cenário 10 — Dependências reprodutíveis e justificadas

**Verifica**: FR-019, FR-020, FR-021 · SC-010

```bash
rm -rf node_modules && npm ci
```

**Esperado**

- `npm ci` instala a partir do lockfile e produz o mesmo conjunto de versões em qualquer
  máquina (SC-010).
- Cada dependência de execução do `package.json` aparece em `docs/dependencies.md` com o
  motivo de existir (FR-020).
- Nenhuma dependência envia dados de convidado para fora do processo (FR-021).

---

## Checklist de saída

Antes de considerar a estrutura pronta:

- [ ] Os 10 cenários acima passam, **incluindo os testes negativos**
- [ ] `npm run verify` passa localmente e no CI, executando o mesmo script
- [ ] `docs/architecture.md`, `docs/dependencies.md` e `docs/data-privacy.md` existem e estão
      coerentes com o código
- [ ] `/speckit-constitution` foi executado para gravar a stack e remover o
      `TODO(TECH_STACK)`, com bump para 1.1.0 (ver Constitution Check em [plan.md](./plan.md))
