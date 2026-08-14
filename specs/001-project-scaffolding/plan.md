# Implementation Plan: Estrutura Inicial do Projeto

**Branch**: `001-project-scaffolding` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-project-scaffolding/spec.md`

## Summary

Entregar o esqueleto executável do projeto RSVP: um único processo Node servindo API HTTP e
o cliente React, com banco SQLite local, quatro camadas de código com direções de dependência
verificadas por lint, três níveis de teste com um exemplo real de cada, e um comando único de
verificação idêntico ao do portão de qualidade.

A abordagem técnica, derivada da [research.md](./research.md): TypeScript `strict` sobre Node
22, React 19 + Vite 7 no cliente (governado pela constituição), Fastify 5 no servidor,
`better-sqlite3` na persistência, Vitest para unidade/contrato e Playwright + axe-core para
ponta a ponta e acessibilidade. As camadas são pastas dentro de um único pacote, e a
separação é imposta por `eslint-plugin-boundaries` em vez de por workspaces — a opção mais
simples que ainda torna FR-008 verificável.

O escopo implementado é uma **fatia vertical fina** (`GET /api/health`,
`GET /api/invitations/:token` e a página de convite), suficiente para que cada nível de teste
tenha um exemplo que atravessa todas as camadas. Os demais fluxos de RSVP são contratados em
[contracts/](./contracts/) mas não implementados aqui.

## Technical Context

**Language/Version**: TypeScript 5.x em modo `strict`, sobre Node.js 22 LTS (fixado em
`.nvmrc` e `engines`)

**Primary Dependencies**: React 19, Vite 7, Fastify 5, `better-sqlite3`

**Storage**: SQLite (arquivo local), `journal_mode = WAL`, `foreign_keys = ON`; migrações
como arquivos SQL numerados em `db/migrations/`

**Testing**: Vitest 3 (unidade, componente com React Testing Library + jsdom, contrato com
`fastify.inject()`), Playwright 1.5x (E2E), `@axe-core/playwright` (acessibilidade),
`@vitest/coverage-v8` (cobertura)

**Target Platform**: Navegadores modernos (a partir de 320px de largura) servidos por um
processo Node local; sem dependência de serviço de nuvem

**Project Type**: Aplicação web full-stack em um único pacote, com quatro camadas internas
(`client`, `server`, `domain`, `shared`)

**Performance Goals**: Suíte de unidade < 30s; suíte completa < 5min (SC-003); instalação
até aplicação rodando em < 10min a partir de clone novo (SC-001)

**Constraints**: Executável com um único comando, sem serviço externo; nenhum dado pessoal de
convidado em log; escritas de RSVP transacionais e nunca perdidas; WCAG 2.1 AA nas páginas de
convidado; sem dependências de terceiros que recebam dados pessoais

**Scale/Scope**: Um evento por instância, ordem de centenas de convidados; nesta feature,
~4 rotas contratadas com 2 implementadas, 4 camadas, 3 níveis de teste

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Avaliação contra a constituição v1.0.0. Cada princípio é nomeado, conforme exige o Workflow.

### I. Test-First (NON-NEGOTIABLE) — ✅ PASS

O ciclo Red-Green-Refactor é viabilizado, não apenas declarado: `npm run test:unit -- <path>`
e o modo `--watch` do Vitest (FR-015) dão feedback em segundos, que é a condição prática para
escrever o teste antes. A ordenação test-first desta própria feature é responsabilidade de
`/speckit-tasks`, que deve emitir a tarefa de teste antes da tarefa de implementação para
cada item da fatia vertical.

Verificação: um teste deliberadamente falho reprova `npm run verify` com código ≠ 0
(cenário de aceite 4.2).

### II. Contract & Integration Testing — ✅ PASS

Contratos HTTP e esquema persistido são pinados por JSON Schema no Fastify (validando
requisição *e* resposta) e por testes de contrato em [contracts/](./contracts/). O E2E roda
contra Fastify real, navegador real e SQLite real — nenhum substituto na camada de
persistência (FR-012).

Exceção declarada e limitada: dos quatro fluxos que a constituição exige cobertos ponta a
ponta, esta feature cobre apenas **visualizar convite**. Os outros três (enviar RSVP, alterar
RSVP, organizador ver respostas) estão contratados mas não implementados — logo, não há
comportamento a cobrir ainda. A obrigação incide sobre a feature que os implementar, e está
registrada em Complexity Tracking para não se perder.

### III. Guest Data Privacy — ✅ PASS

- Coleta mínima: o modelo de dados tem apenas os campos com propósito declarado
  ([data-model.md](./data-model.md)).
- Nenhum dado pessoal em log: ponto único de log com redação, `console.*` proibido por lint,
  e teste que falha se valor pessoal semeado aparecer na saída (R-009, SC-008).
- Isolamento entre convidados: a rota de convite retorna somente a resposta do próprio
  token; nada agregado do evento.
- Tokens não adivinháveis: 32 bytes de CSPRNG, indexados por hash (R-010).
- Retenção documentada por campo em [data-model.md](./data-model.md), com operação de purga
  contratada.
- Nenhuma dependência de terceiro recebe dados pessoais (tabela de dependências em
  [research.md](./research.md)).

### IV. Accessibility & Mobile-First Delivery — ✅ PASS

`eslint-plugin-jsx-a11y` cobre o estático; `@axe-core/playwright` cobre a página renderizada
em viewport de 320px, reprovando em violações A/AA (FR-018). A regra de arquitetura de usar
`<form>` e controles HTML nativos, registrada em `docs/architecture.md`, é o que sustenta a
exigência de completar um RSVP sem interação dependente de ponteiro. Verificação manual por
teclado e leitor de tela permanece como item de revisão — a automação é o piso, não o teto
(R-006).

### V. Simplicity & YAGNI — ✅ PASS

Um pacote, um processo, um banco em arquivo. Sem monorepo, sem ORM, sem cache, sem fila, sem
camada de container de injeção, sem biblioteca de componentes. Cada dependência de execução
tem justificativa nominal registrada (FR-020). A fatia vertical é deliberadamente fina para
não construir produto sob o rótulo de estrutura (R-011).

Duas escolhas que somam superfície e por isso estão em Complexity Tracking: a camada `ports`
no domínio e o runner de migração próprio.

### Portões de Workflow — ✅ PASS

`npm run verify` é o único portão, e o CI executa exatamente esse script — a divergência
entre local e portão é impossível por construção, não por disciplina (FR-017, SC-007).

### ⚠️ Pendência de governança (não bloqueante para o design, bloqueante para o merge)

A constituição carrega `TODO(TECH_STACK)` e exige que linguagem, framework e motor de
armazenamento sejam "fixados neste documento no primeiro `/speckit-plan`, como bump MINOR".
Este plano **decide** a stack (Technical Context acima), mas **não edita a constituição**:
a própria seção de Governança determina que emendas sejam feitas via `/speckit-constitution`.

**Ação exigida antes do merge desta feature**: rodar `/speckit-constitution` para gravar
TypeScript/Node 22, React+Vite, Fastify e SQLite na seção *Technology Stack & Constraints*,
removendo o `TODO(TECH_STACK)`, com bump para **1.1.0**.

### Re-avaliação pós-Fase 1 — ✅ PASS

Reexecutada após gerar `data-model.md`, `contracts/` e `quickstart.md`. O design não
introduziu violação nova; três pontos foram *reforçados* pelos artefatos:

- **Princípio III**: o contrato HTTP passou a exigir que token inexistente e token
  malformado produzam resposta idêntica (sem oráculo de enumeração), que respostas com dado
  pessoal levem `Cache-Control: no-store`, e que a resposta de convite não exponha nenhum
  identificador interno. Nada disso estava explícito antes da Fase 1.
- **Princípio III / bloqueio**: `GET /api/events/:eventId/responses` foi marcada como
  **não registrável** enquanto não houver autenticação de organizador — desprotegida, ela
  expõe todos os dados pessoais do evento a quem souber um `eventId`.
- **Princípio V**: a port `InvitationRepository` foi fechada em quatro métodos, um por fluxo
  nomeado, com proibição explícita de `findAll` ou critérios genéricos.

Nenhuma linha de Complexity Tracking foi adicionada nesta re-avaliação.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-scaffolding/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── README.md
│   ├── http-api.md
│   └── ports.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── domain/                     # Regras puras. Sem I/O, sem React, sem node:*
│   ├── rsvp/
│   │   ├── invitation.ts       # Regras de convite (validade, capacidade)
│   │   └── response.ts         # Regras de resposta (transições, prazo)
│   └── ports/
│       └── invitation-repository.ts   # Contrato que a persistência implementa
│
├── server/                     # Processo Node. Pode usar domain e shared
│   ├── main.ts                 # Entrypoint: monta app, aplica migrações, escuta
│   ├── app.ts                  # Composição do Fastify (testável via inject)
│   ├── http/
│   │   ├── health.route.ts
│   │   ├── invitations.route.ts
│   │   └── schemas.ts          # JSON Schemas de requisição/resposta
│   ├── persistence/
│   │   ├── db.ts               # Abertura do SQLite, pragmas, migrações
│   │   ├── migrate.ts          # Runner de migração
│   │   └── invitation-repository.sqlite.ts   # Implementa a port do domínio
│   ├── logging/
│   │   └── logger.ts           # Ponto ÚNICO de log, com redação de PII
│   └── tokens/
│       └── invite-token.ts     # Geração e hash de token (CSPRNG)
│
├── client/                     # React. Pode usar apenas shared
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   └── InvitationPage.tsx
│   ├── components/
│   └── api/
│       └── client.ts           # Chamadas HTTP tipadas pelos tipos de shared
│
└── shared/                     # Tipos de contrato. Não importa ninguém
    └── contracts/
        └── invitation.ts

tests/
├── unit/                       # Domínio puro; alvo < 30s
│   └── domain/
├── component/                  # React Testing Library + jsdom
├── contract/                   # fastify.inject() + SQLite temporário
│   ├── health.contract.test.ts
│   ├── invitations.contract.test.ts
│   └── logging-privacy.contract.test.ts   # SC-008
└── e2e/                        # Playwright: navegador + servidor + banco reais
    ├── view-invitation.spec.ts
    └── accessibility.spec.ts

db/
└── migrations/
    └── 0001_initial.sql

docs/
├── architecture.md             # Camadas, arestas permitidas, onde colocar o quê (FR-007)
├── dependencies.md             # Cada dependência de execução e seu motivo (FR-020)
└── data-privacy.md             # Propósito e retenção por campo (FR-023)

.nvmrc                          # Versão de Node exigida (FR-002)
eslint.config.js                # Flat config + boundaries + jsx-a11y (FR-008)
vite.config.ts                  # Build do cliente + proxy /api
vitest.config.ts                # Projetos: unit, component, contract
playwright.config.ts            # E2E com banco isolado por worker
README.md                       # Pré-requisitos e os 5 comandos (FR-003)
```

**Structure Decision**: Um único pacote npm com quatro camadas como diretórios sob `src/`,
e não workspaces de monorepo. As arestas de dependência permitidas
(`client → shared`, `server → domain|shared`, `domain → shared`, `shared → nada`) são
declaradas em `eslint.config.js` via `eslint-plugin-boundaries` e reprovam `npm run verify`
quando violadas — o que satisfaz FR-006 e FR-008 sem o custo de múltiplos manifestos, builds
por pacote e resolução entre pacotes que um monorepo imporia (Princípio V, R-007).

Os testes ficam em `tests/`, separados por nível, e não colocados junto ao código: FR-010 e
FR-015 exigem que cada nível seja endereçável e executável isoladamente por caminho, o que um
diretório por nível entrega diretamente.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Camada `domain/ports` (inversão de dependência) | FR-006 exige que o domínio não conheça o mecanismo de armazenamento, e o Princípio II exige regras de RSVP testáveis por unidade sem banco. Sem a port, o domínio importaria o repositório SQLite e a aresta proibida se tornaria inevitável. | Chamar `better-sqlite3` direto do domínio é menos código, mas torna FR-006 e FR-008 inatingíveis e força todo teste de regra a subir um banco — quebrando o alvo de 30s de SC-003. |
| Runner de migração próprio (~40 linhas) | O esquema precisa ser versionado e aplicável de forma repetível (FR-001: o comando de execução inicializa o banco; caso de borda de banco não inicializado). | Uma biblioteca de migração traz CLI, configuração e modelo de rollback que este esquema não usa — mais superfície que as 40 linhas que substitui (Princípio V). SQL cru sem versionamento foi descartado por não ser repetível. |
| Fatia vertical implementada cobre só 1 dos 4 fluxos ponta a ponta da constituição | FR-013 exige exemplo executável de cada nível de teste, e um exemplo só é replicável se atravessar todas as camadas. Os outros três fluxos não têm comportamento especificado ainda. | Implementar os quatro agora seria construir produto sem spec de produto (Princípio V, R-011). Não implementar nenhum deixaria os exemplos de teste sem caminho real. **Obrigação transferida**: a feature que implementar cada fluxo restante DEVE trazer sua cobertura E2E junto (Princípio II). |
