---

description: "Task list for 001-project-scaffolding"
---

# Tasks: Estrutura Inicial do Projeto

**Input**: Design documents from `/specs/001-project-scaffolding/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: **OBRIGATÓRIOS.** O Princípio I da constituição é NON-NEGOTIABLE — nenhuma tarefa
de implementação pode ser executada antes que a tarefa de teste correspondente exista e
falhe pelo motivo esperado. Onde uma tarefa de teste precede uma de implementação, essa
ordem é normativa, não sugestão.

**Organization**: Tarefas agrupadas por história de usuário, para que cada uma seja
implementável e testável de forma independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos distintos, sem dependência pendente)
- **[Story]**: A qual história a tarefa pertence (US1..US5)
- Todo caminho de arquivo é relativo à raiz do repositório

## Path Conventions

Pacote npm único com quatro camadas sob `src/` (`client`, `server`, `domain`, `shared`) e
testes por nível sob `tests/`, conforme *Structure Decision* em [plan.md](./plan.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar o pacote e o esqueleto de diretórios. Sem código executável ainda.

- [X] T001 Criar `package.json` com `name`, `type: "module"`, `private: true` e `engines.node: ">=22 <23"` na raiz do repositório
- [X] T002 [P] Criar `.nvmrc` na raiz com a versão Node 22 LTS exigida (FR-002)
- [X] T003 [P] Criar `.gitignore` na raiz ignorando `node_modules/`, `dist/`, `coverage/`, `*.sqlite`, `*.sqlite-wal`, `*.sqlite-shm`, `test-results/`, `playwright-report/`
- [ ] T004 Instalar dependências de execução (`react`, `react-dom`, `fastify`, `@fastify/static`, `better-sqlite3`) e de desenvolvimento (`typescript`, `vite`, `@vitejs/plugin-react`, `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `jsdom`, `@playwright/test`, `@axe-core/playwright`, `eslint`, `typescript-eslint`, `eslint-plugin-boundaries`, `eslint-plugin-jsx-a11y`, `prettier`), gerando `package-lock.json` (FR-019)
- [X] T005 [P] Criar `tsconfig.json` na raiz em modo `strict`, com `moduleResolution: "bundler"`, `noUncheckedIndexedAccess` e paths de alias por camada (`@domain/*`, `@server/*`, `@client/*`, `@shared/*`)
- [X] T006 [P] Criar `tsconfig.node.json` para arquivos de configuração e para o processo servidor
- [X] T007 Criar a árvore de diretórios vazia conforme *Source Code* em plan.md: `src/{domain/{rsvp,ports},server/{http,persistence,logging,tokens},client/{pages,components,api},shared/contracts}`, `tests/{unit,component,contract,e2e}`, `db/migrations`, `docs`
- [X] T008 [P] Criar `docs/dependencies.md` registrando cada dependência de execução instalada em T004 com sua justificativa, copiando a tabela de [research.md](./research.md) (FR-020, FR-021)

**Checkpoint**: Pacote instalável; `npm ci` funciona; nada roda ainda.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura que TODA história consome — tipos de contrato, banco, log,
tokens, composição do servidor e o runner de testes de unidade/contrato.

**⚠️ CRITICAL**: Nenhuma história pode começar antes desta fase terminar.

- [X] T009 [P] Criar `src/shared/contracts/invitation.ts` com os tipos `InvitationView`, `EventView`, `RsvpResponseView` e `ApiError`, derivados de [contracts/http-api.md](./contracts/http-api.md)
- [X] T010 [P] Criar `vitest.config.ts` na raiz definindo três projetos — `unit` (ambiente node, `tests/unit/`), `component` (ambiente jsdom, `tests/component/`) e `contract` (ambiente node, `tests/contract/`) — com cobertura via `@vitest/coverage-v8` (FR-010, FR-014, FR-015)
- [X] T011 [P] Adicionar os scripts `test:unit`, `test:component`, `test:contract`, `test:coverage` e `test` ao `package.json`, cada um delegando ao projeto Vitest correspondente
- [X] T012 Criar `db/migrations/0001_initial.sql` com as tabelas `event` e `invitation` conforme [data-model.md](./data-model.md), incluindo `UNIQUE(token_hash)` e as restrições `CHECK` de validação
- [X] T013 Escrever teste de contrato do runner de migração em `tests/contract/migrate.contract.test.ts`, cobrindo: aplicar em banco vazio cria as tabelas; aplicar duas vezes é idempotente; migração inválida não deixa aplicação parcial — **deve falhar antes de T014**
- [X] T014 Implementar o runner de migração em `src/server/persistence/migrate.ts`, lendo `db/migrations/*.sql` em ordem numérica e registrando as aplicadas em uma tabela de controle, dentro de transação
- [X] T015 Implementar `src/server/persistence/db.ts` abrindo o SQLite com `journal_mode = WAL` e `foreign_keys = ON`, e aplicando migrações pendentes na abertura (R-004)
- [X] T016 [P] Criar `src/server/logging/logger.ts` como ponto único de log, envolvendo o logger do Fastify — a redação de PII é adicionada em T057, esta tarefa entrega apenas o ponto único (R-009)
- [X] T017 [P] Escrever testes de unidade de token em `tests/unit/server/invite-token.test.ts`: token gerado casa com `^[A-Za-z0-9_-]{43}$`; dois tokens nunca colidem; o hash é estável para o mesmo token — **deve falhar antes de T018**
- [X] T018 Implementar `src/server/tokens/invite-token.ts` com geração via `randomBytes(32)` em base64url e hash SHA-256 (R-010, FR-024)
- [X] T019 Criar `src/server/app.ts` compondo uma instância Fastify sem rotas, exportada como função para permitir `fastify.inject()` nos testes de contrato

**Checkpoint**: Banco, log, tokens e runner de testes prontos; histórias podem começar.

---

## Phase 3: User Story 1 - Rodar o projeto com um único comando (Priority: P1) 🎯 MVP

**Goal**: Um clone novo chega a uma aplicação rodando no navegador com dois comandos
documentados, sem serviço externo.

**Independent Test**: Em um clone limpo, seguir só o README e ver a página inicial no
navegador, com `GET /api/health` respondendo `200`.

### Tests for User Story 1 ⚠️

> Escrever primeiro; confirmar que falham pelo motivo esperado.

- [X] T020 [P] [US1] Teste de contrato de saúde em `tests/contract/health.contract.test.ts`: `GET /api/health` retorna `200` com `{"status":"ok","checks":{"database":"ok"}}` quando as migrações estão aplicadas, e `503` com `status: "degraded"` quando o banco está indisponível (contracts/http-api.md)

### Implementation for User Story 1

- [X] T021 [US1] Implementar `src/server/http/health.route.ts` conforme o contrato, sem expor versão, caminho de banco ou variáveis de ambiente
- [X] T022 [US1] Registrar a rota de saúde em `src/server/app.ts`
- [X] T023 [US1] Criar `src/server/main.ts` como entrypoint: abre o banco (aplicando migrações), monta o app e escuta na porta configurada
- [X] T024 [P] [US1] Criar `src/client/main.tsx` e `src/client/App.tsx` com a página inicial mínima
- [X] T025 [US1] Criar `vite.config.ts` na raiz com `@vitejs/plugin-react` e proxy de `/api` para o processo Node (FR-004)
- [X] T026 [US1] Adicionar os scripts `dev`, `build` e `start` ao `package.json`, de modo que `npm run dev` suba cliente e servidor com um único comando (FR-001)
- [X] T027 [US1] Criar `README.md` na raiz com pré-requisitos, versão de Node exigida e os cinco comandos: instalação, execução, teste, verificação e cobertura (FR-003)

**Checkpoint**: Cenários 1 e 2 do [quickstart.md](./quickstart.md) passam. MVP entregue.

---

## Phase 4: User Story 2 - Escrever um teste antes de escrever código (Priority: P1)

**Goal**: Os três níveis de teste existem, têm lugar convencionado e ao menos um exemplo
real que atravessa todas as camadas — e o E2E roda contra armazenamento real.

**Independent Test**: Adicionar um teste deliberadamente falho e confirmar saída ≠ 0 com
arquivo e linha nomeados; depois corrigir e ver passar.

### Tests for User Story 2 ⚠️

> Estes testes definem a fatia vertical. Todos devem falhar antes de T035.

- [X] T028 [P] [US2] Teste de unidade de domínio em `tests/unit/domain/invitation.test.ts`: validade do convite, limites de `maxPartySize` (1..20) e `guestName` não vazio conforme data-model.md
- [X] T029 [P] [US2] Teste de unidade de domínio em `tests/unit/domain/response.test.ts`: `not_attending` ⇒ `partySize = 0`; `attending` ⇒ `1 ≤ partySize ≤ maxPartySize`; recusa após `rsvpDeadline`
- [X] T030 [P] [US2] Teste de contrato da port em `tests/contract/invitation-repository.contract.test.ts` contra SQLite temporário real: `findByToken` com token válido retorna o agregado; com token inexistente retorna `null` sem lançar; passar o `tokenHash` como se fosse token cru não resolve (contracts/ports.md)
- [X] T031 [P] [US2] Teste de contrato da rota em `tests/contract/invitations.contract.test.ts`: `200` com o esquema exato; asserção sobre o **conjunto de chaves** provando ausência de `id`, `eventId`, `token` e `tokenHash`; `404 invitation_not_found` para token inexistente **e** para token malformado, com corpo idêntico; cabeçalho `Cache-Control: no-store`
- [X] T032 [P] [US2] Teste de componente em `tests/component/InvitationPage.test.tsx` com React Testing Library: renderiza nome do convidado e dados do evento a partir de um `InvitationView`
- [X] T033 [US2] Criar `playwright.config.ts` na raiz com `webServer` apontando para `npm run start`, espera por `GET /api/health`, e um arquivo SQLite temporário exclusivo por worker (FR-012)
- [X] T034 [US2] Teste E2E em `tests/e2e/view-invitation.spec.ts`: semear um convite no banco de teste, abrir a URL com o token e ver o nome do convidado na página — contra servidor, navegador e SQLite reais, sem duplo de teste na persistência

### Implementation for User Story 2

- [X] T035 [P] [US2] Implementar as regras de convite em `src/domain/rsvp/invitation.ts` (puro, sem I/O, sem `node:*`)
- [X] T036 [P] [US2] Implementar as regras de resposta em `src/domain/rsvp/response.ts`, incluindo as transições de estado de data-model.md
- [X] T037 [US2] Declarar a port em `src/domain/ports/invitation-repository.ts` com apenas `findByToken` implementada e as demais assinaturas documentadas como não implementadas (contracts/ports.md)
- [X] T038 [US2] Implementar `src/server/persistence/invitation-repository.sqlite.ts`, recebendo o token cru e fazendo o hash internamente — o token cru nunca chega ao banco
- [X] T039 [US2] Criar os JSON Schemas de requisição e resposta em `src/server/http/schemas.ts`, validando **as duas direções** (contracts/README.md, regra 1)
- [X] T040 [US2] Implementar `src/server/http/invitations.route.ts` para `GET /api/invitations/:token` e registrá-la em `src/server/app.ts`
- [X] T041 [P] [US2] Implementar `src/client/pages/InvitationPage.tsx` e `src/client/api/client.ts`, tipados exclusivamente por `src/shared/contracts/` — sem importar nada de `src/server/`
- [X] T042 [US2] Adicionar os scripts `test:e2e` e `test:e2e:ui` ao `package.json` e documentar em `README.md` como rodar um único arquivo e o modo `--watch` (FR-015)

**Checkpoint**: Cenários 3 e 4 do quickstart passam, incluindo o teste negativo do teste falho.

---

## Phase 5: User Story 3 - Saber onde cada coisa mora (Priority: P2)

**Goal**: A arquitetura é documentada **e** verificada: violar a direção de dependência
reprova o lint.

**Independent Test**: Adicionar em `src/domain/` um import de `src/server/persistence/db`
e confirmar que `npm run lint` sai com código ≠ 0 nomeando a violação de camada.

### Tests for User Story 3 ⚠️

- [X] T043 [US3] Criar `tests/architecture/boundaries.test.ts` (projeto `unit`) que executa o ESLint programaticamente sobre um trecho com import proibido de `server` dentro de `domain` e afirma que a violação é reportada como `error` — **deve falhar antes de T045** (FR-008, SC-006)

### Implementation for User Story 3

- [X] T044 [P] [US3] Criar `.prettierrc` e `.prettierignore` na raiz
- [X] T045 [US3] Criar `eslint.config.js` na raiz (flat config) com `typescript-eslint` e `eslint-plugin-boundaries`, declarando as quatro camadas e as arestas `client → shared`, `server → domain|shared`, `domain → shared`, `shared → ∅`; violação como `error` (R-007)
- [X] T046 [US3] Adicionar ao `eslint.config.js` a proibição de `node:*` e de qualquer driver de banco dentro de `src/domain/`
- [X] T047 [US3] Adicionar `eslint-plugin-jsx-a11y` ao `eslint.config.js` aplicado a `src/client/` (Princípio IV)
- [X] T048 [US3] Adicionar os scripts `lint`, `lint:fix`, `format` e `format:check` ao `package.json`
- [X] T049 [US3] Escrever `docs/architecture.md` com: as quatro camadas, o diagrama de arestas permitidas, onde colocar cada tipo de código novo, a regra de usar `<form>` e controles HTML nativos (Princípio IV), e a política de quarentena rastreada para testes intermitentes (FR-007, caso de borda da spec)

**Checkpoint**: Cenário 5 do quickstart passa, incluindo o teste negativo de violação de camada.

---

## Phase 6: User Story 4 - Falhar cedo antes do merge (Priority: P2)

**Goal**: Um comando único produz o veredito do portão, e o CI executa exatamente esse
comando.

**Independent Test**: Introduzir, uma de cada vez, uma violação de formato, de lint, de tipo
e de teste; confirmar que `npm run verify` reprova identificando a etapa e o arquivo.

### Tests for User Story 4 ⚠️

- [X] T050 [US4] Criar `tests/verify/verify-gate.test.ts` que roda `npm run verify` em uma cópia temporária do repositório com uma violação injetada por vez e afirma saída ≠ 0 com a etapa correta nomeada — **deve falhar antes de T052** (SC-007)

### Implementation for User Story 4

- [X] T051 [P] [US4] Adicionar o script `typecheck` (`tsc --noEmit -p tsconfig.json`) ao `package.json`
- [X] T052 [US4] Adicionar o script `verify` ao `package.json` encadeando, nesta ordem, `format:check` → `lint` → `typecheck` → `test:unit` → `test:component` → `test:contract` → `test:e2e`, abortando na primeira falha (FR-016)
- [X] T053 [US4] Criar `.github/workflows/verify.yml` executando **apenas** `npm ci` e `npm run verify`, sem lista própria de etapas (FR-017, SC-007)
- [X] T054 [US4] Configurar no workflow o cache de dependências e a instalação dos navegadores do Playwright, sem adicionar etapas de verificação fora do `verify`
- [X] T055 [US4] Documentar em `README.md` que `npm run verify` é o portão e que o CI roda exatamente esse script
- [X] T056 [US4] Registrar em `docs/architecture.md` a proibição de pular ou remover teste vermelho para destravar merge (Workflow da constituição)

**Checkpoint**: Cenários 6 e 7 do quickstart passam, com os quatro testes negativos.

---

## Phase 7: User Story 5 - Confiar que dados de convidado não vazam (Priority: P3)

**Goal**: O caminho de log não aceita dado pessoal, e isso é verificado por teste — não por
disciplina.

**Independent Test**: Registrar deliberadamente `logger.info({ guestEmail })` em um caminho
do servidor e confirmar que a suíte reprova.

### Tests for User Story 5 ⚠️

- [X] T057 [US5] Teste de contrato em `tests/contract/logging-privacy.contract.test.ts`: capturar a saída de log durante `GET /api/invitations/:token` com nome, e-mail e token semeados, e falhar se qualquer um desses valores aparecer — cobre tanto objeto logado quanto interpolação de string — **deve falhar antes de T058** (SC-008)
- [X] T058 [P] [US5] Teste E2E de acessibilidade em `tests/e2e/accessibility.spec.ts` com `@axe-core/playwright`, na página de convite em viewport de 320px, reprovando em qualquer violação A ou AA (FR-018, SC-008 do quickstart Cenário 8)

### Implementation for User Story 5

- [X] T059 [US5] Adicionar a lista de redação em `src/server/logging/logger.ts` cobrindo `name`, `guestName`, `email`, `guestEmail`, `phone`, `dietaryNotes`, `accessibilityNotes` e `token` (R-009)
- [X] T060 [US5] Adicionar ao `eslint.config.js` a proibição de `console.*` em `src/server/`, forçando todo log a passar pelo ponto único
- [X] T061 [US5] Garantir que as respostas de erro de `src/server/http/` nunca incluam dado pessoal, valor de token, detalhe de banco, caminho de arquivo ou stack trace, conforme o formato de erro de contracts/http-api.md
- [X] T062 [P] [US5] Escrever `docs/data-privacy.md` com propósito e limite de retenção de 100% dos campos pessoais de [data-model.md](./data-model.md) (FR-023, SC-009)
- [X] T063 [US5] Registrar em `docs/architecture.md` que `GET /api/events/:eventId/responses` **não deve ser registrada** — nem desprotegida em desenvolvimento — enquanto não existir autenticação de organizador (plan.md, re-avaliação pós-Fase 1)

**Checkpoint**: Cenários 8 e 9 do quickstart passam, com os testes negativos.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T064 [P] Adicionar a `docs/dependencies.md` qualquer dependência incorporada após T008, com justificativa (FR-020)
- [X] T065 [P] Confirmar em `README.md` que os cinco comandos documentados batem exatamente com os scripts do `package.json` (SC-002)
- [ ] T066 Medir os tempos de suíte e registrar no README: unidade < 30s, completa < 5min (SC-003)
- [ ] T067 [P] Verificar manualmente a navegação por teclado da página de convite — todo interativo alcançável, ordem de foco previsível, foco visível (Princípio IV; não automatizável)
- [ ] T068 Rodar `rm -rf node_modules && npm ci` e confirmar conjunto idêntico de versões (FR-019, SC-010)
- [ ] T069 Executar o roteiro completo do [quickstart.md](./quickstart.md), **incluindo todos os testes negativos**, e marcar o Checklist de saída
- [X] T070 Executar `/speckit-constitution` para gravar a stack decidida na seção *Technology Stack & Constraints*, removendo o `TODO(TECH_STACK)`, com bump para 1.1.0 — **bloqueante para o merge** (Constitution Check em plan.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende de Setup — **bloqueia todas as histórias**
- **US1 (Phase 3)**: depende de Foundational
- **US2 (Phase 4)**: depende de Foundational; T034 (E2E) depende de T023 e T026 (US1), pois o E2E precisa de um servidor iniciável
- **US3 (Phase 5)**: depende de Foundational; o valor real do lint de camadas aparece quando existe código nas quatro camadas (US2)
- **US4 (Phase 6)**: depende de US3 (T052 encadeia `lint` e `format:check`, criados em T044/T045)
- **US5 (Phase 7)**: depende de Foundational (T016) e da rota de convite (T040) para ter fluxo a auditar
- **Polish (Phase 8)**: depende de todas as histórias desejadas

### Dependências entre histórias — leitura honesta

Esta é uma feature de infraestrutura, e por isso as histórias **não são tão independentes
quanto em uma feature de produto**. As dependências reais:

- **US1** é genuinamente independente — é o MVP.
- **US2** é independente para os níveis de unidade, componente e contrato; apenas o E2E
  precisa que US1 tenha entregue um servidor iniciável.
- **US3** é escrevível a qualquer momento, mas só *demonstra* valor com código nas camadas.
- **US4** depende de US3 por composição: o portão encadeia comandos que US3 cria.
- **US5** precisa de um fluxo real para auditar; ganha isso de US2.

Ordem recomendada de entrega: **US1 → US2 → US3 → US4 → US5**, que é também a ordem de
prioridade da spec.

### Within Each User Story

- Testes ANTES da implementação, e devem falhar pelo motivo esperado (Princípio I)
- Domínio antes de persistência; persistência antes de rota; rota antes de cliente
- Configuração antes do script que a invoca

### Parallel Opportunities

- Setup: T002, T003, T005, T006, T008 em paralelo após T001
- Foundational: T009, T010, T016, T017 em paralelo; T012→T013→T014→T015 é cadeia serial
- US2: os seis testes T028–T032 em paralelo; depois T035, T036 e T041 em paralelo
- US3: T044 em paralelo com T045
- US5: T057 e T058 em paralelo; T062 em paralelo com o restante
- Polish: T064, T065, T067 em paralelo

---

## Parallel Example: User Story 2

```bash
# Escrever todos os testes da fatia vertical juntos (todos devem falhar):
Task: "Teste de unidade de convite em tests/unit/domain/invitation.test.ts"
Task: "Teste de unidade de resposta em tests/unit/domain/response.test.ts"
Task: "Teste de contrato da port em tests/contract/invitation-repository.contract.test.ts"
Task: "Teste de contrato da rota em tests/contract/invitations.contract.test.ts"
Task: "Teste de componente em tests/component/InvitationPage.test.tsx"

# Confirmar o vermelho, depois implementar as camadas independentes juntas:
Task: "Regras de convite em src/domain/rsvp/invitation.ts"
Task: "Regras de resposta em src/domain/rsvp/response.ts"
Task: "Página de convite em src/client/pages/InvitationPage.tsx"
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1: Setup
2. Phase 2: Foundational (CRÍTICO — bloqueia tudo)
3. Phase 3: US1
4. **PARAR E VALIDAR**: Cenários 1 e 2 do quickstart
5. A aplicação roda com um comando — é um incremento demonstrável

### Incremental Delivery

1. Setup + Foundational → base pronta
2. + US1 → app rodando (**MVP**)
3. + US2 → três níveis de teste com exemplos reais atravessando as camadas
4. + US3 → arquitetura documentada e fiscalizada pelo lint
5. + US4 → portão único, local e CI idênticos
6. + US5 → privacidade de log verificada e acessibilidade automatizada

### Parallel Team Strategy

Depois de Foundational, com três pessoas: A em US1→US2 (o caminho crítico, pois US2 depende
do servidor de US1); B em US3→US4 (a cadeia de lint e portão); C em US5 e na documentação
(`docs/data-privacy.md`, `docs/dependencies.md`), integrando quando a rota de convite existir.

---

## Notes

- `[P]` = arquivos distintos, sem dependência pendente
- Verificar o **vermelho** antes de implementar — um teste que nunca falhou não provou nada
- Commit por tarefa ou grupo lógico
- T070 é bloqueante para merge: a constituição exige a stack gravada nela, e nenhuma outra
  tarefa a satisfaz

---

## Status de execução (`/speckit-implement`, 2026-08-13)

**65 de 70 tarefas entregues.** As cinco pendentes têm uma única causa raiz.

### Bloqueio: ambiente sem Node 22

A máquina tem apenas Node 25.2.1 (via asdf); a constituição v1.1.0 fixa Node 22 LTS. Por
decisão do usuário, a implementação foi feita **fiel à constituição, sem instalar nada** —
logo `npm install` não rodou e **nenhum teste foi executado**.

| Tarefa | Por que está pendente |
|---|---|
| T004 | `npm install` exigiria Node 22; sem ele não há `package-lock.json` |
| T066 | Medir tempo de suíte exige executá-la |
| T067 | Verificação manual de teclado exige a aplicação rodando |
| T068 | `npm ci` exige lockfile (T004) |
| T069 | O roteiro do quickstart exige a aplicação rodando |

### Consequência para o Princípio I

Os testes foram **escritos**, mas nenhum foi visto **falhar**. O ciclo Red-Green-Refactor não
foi fechado. As tarefas de teste estão marcadas porque o arquivo existe e está completo, não
porque o vermelho foi observado.

**Antes de confiar nesta suíte**, com Node 22 instalado:

```bash
npm install && npm run verify
```

E rode ao menos um teste negativo do [quickstart.md](./quickstart.md) — asserção invertida,
import proibido entre camadas — para confirmar que o portão sabe reprovar.
