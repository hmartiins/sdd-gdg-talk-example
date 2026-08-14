# RSVP Example

Aplicação web de RSVP para um evento: o convidado abre o link que recebeu, vê seu convite e
responde. Um único processo Node serve a API e o cliente React, com banco SQLite local — sem
container, sem credencial, sem serviço de nuvem.

## Pré-requisitos

- **Node.js 22 LTS** — a versão exigida está em `.nvmrc` (e em `.tool-versions`, para quem usa
  asdf). Uma versão fora do intervalo faz `npm install` falhar citando a versão esperada, em
  vez de produzir erro obscuro depois.
- **npm 10+**

```bash
nvm use          # ou: asdf install
```

## Os cinco comandos

| Comando | O que faz |
|---|---|
| `npm ci` | Instala as dependências a partir do lockfile (reprodutível) |
| `npm run dev` | Sobe cliente e servidor com recarregamento automático |
| `npm test` | Roda unidade, componente, contrato e arquitetura |
| `npm run verify` | **O portão**: formato, lint, tipos e todos os testes |
| `npm run test:coverage` | Relatório de cobertura em `coverage/` |

Depois de `npm run dev`, o cliente fica em <http://127.0.0.1:5173> e a API em
<http://127.0.0.1:3000>. O Vite faz proxy de `/api`, então não há CORS nem URL de API
configurável — só existe uma origem.

O banco é criado e migrado sozinho na primeira execução, em `./data/rsvp.sqlite`.

## Testes

Quatro níveis, cada um com lugar e propósito próprios:

```bash
npm run test:unit           # regras de domínio, puras — alvo < 30s
npm run test:component      # React em jsdom
npm run test:contract       # Fastify real + SQLite real
npm run test:architecture   # fronteiras entre camadas (ESLint programático)
npm run test:e2e            # navegador + servidor + banco reais
```

Para o ciclo test-first (obrigatório neste projeto — ver
[constituição](.specify/memory/constitution.md), Princípio I):

```bash
npm run test:unit -- --watch                          # reexecuta ao salvar
npm run test:unit -- tests/unit/domain/response.test.ts   # um arquivo só
```

Os testes E2E usam um arquivo SQLite temporário próprio: o banco de desenvolvimento nunca é
tocado, e interromper a suíte no meio não deixa estado sujo.

Há ainda `npm run test:gate`, que verifica se o próprio `npm run verify` sabe **reprovar**.
Ele fica fora do `verify` de propósito — incluí-lo criaria recursão infinita.

## O portão

```bash
npm run verify
```

Encadeia, do mais barato ao mais caro: `format:check` → `lint` → `typecheck` → `test:unit` →
`test:component` → `test:contract` → `test:architecture` → `test:e2e`. Aborta na primeira
falha.

**O CI executa exatamente este script**, sem lista própria de etapas
(`.github/workflows/verify.yml`). É o que torna impossível, por construção, o portão divergir
do que roda na sua máquina.

Teste vermelho bloqueia merge. Pular ou remover um teste que falha para destravar merge é
proibido pela constituição.

## Estrutura

```
src/domain/    regras de RSVP e ports — puro, sem I/O
src/server/    HTTP, persistência SQLite, log, tokens
src/client/    React
src/shared/    tipos do contrato HTTP
tests/         unit, component, contract, architecture, e2e, gate
db/migrations/ SQL numerado, aplicado automaticamente
docs/          arquitetura, dependências, privacidade
```

As direções de dependência permitidas (`client → shared`, `server → domain|shared`,
`domain → shared`, `shared → ∅`) não são apenas convenção: `eslint-plugin-boundaries` reprova
`npm run verify` quando violadas.

Comece por [docs/architecture.md](docs/architecture.md) — ele responde "onde eu coloco isto?".

## Documentação

| Documento | Assunto |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Camadas, onde colocar cada coisa, regras de UI e do portão |
| [docs/dependencies.md](docs/dependencies.md) | Cada dependência e por que ela existe |
| [docs/data-privacy.md](docs/data-privacy.md) | Campos pessoais, propósito e retenção |
| [.specify/memory/constitution.md](.specify/memory/constitution.md) | Os princípios que tudo isso serve |

## Escopo atual

A estrutura implementa uma **fatia vertical fina**: `GET /api/health`,
`GET /api/invitations/:token` e a página de convite. Isso basta para que cada nível de teste
tenha um exemplo real atravessando todas as camadas.

Contratados e ainda **não** implementados: enviar RSVP, alterar RSVP e a visão do organizador
(ver `specs/001-project-scaffolding/contracts/`). A rota do organizador está deliberadamente
bloqueada até existir autenticação — sem ela, exporia os dados pessoais de todos os
convidados do evento.
