# Arquitetura

Este documento responde a uma pergunta: **onde eu coloco o código que estou escrevendo?**

Ele não é decorativo. As regras de dependência descritas aqui são fiscalizadas por
`eslint.config.js` e reprovam `npm run verify` quando violadas (FR-008). Documentar sem
fiscalizar não satisfaz o requisito — a constituição diz isso com todas as letras.

## As quatro camadas

```
┌──────────────┐        ┌──────────────┐
│    client    │        │    server    │
│  React, UI   │        │ HTTP, banco  │
└──────┬───────┘        └───┬──────┬───┘
       │                    │      │
       │                    │      ▼
       │                    │   ┌──────────────┐
       │                    │   │    domain    │
       │                    │   │ regras puras │
       │                    │   └──────┬───────┘
       │                    │          │
       ▼                    ▼          ▼
    ┌───────────────────────────────────────┐
    │                shared                 │
    │        tipos de contrato apenas       │
    └───────────────────────────────────────┘
```

| Camada | O que mora aqui | Pode importar |
|---|---|---|
| `src/domain/` | Regras de RSVP e as *ports* que a persistência implementa | `domain`, `shared` |
| `src/server/` | Rotas HTTP, esquemas, persistência SQLite, log, tokens | `server`, `domain`, `shared` |
| `src/client/` | Páginas e componentes React, cliente HTTP | `client`, `shared` |
| `src/shared/` | Tipos do contrato HTTP | `shared` (nada mais) |

Proibições explícitas, cada uma com um teste em `tests/architecture/boundaries.test.ts`:

- `domain → server`, `domain → client`
- `client → server`, `client → domain`
- `node:*`, `better-sqlite3`, `fastify` ou `react` dentro de `domain`
- `console.*` em `src/server/` (fora de `src/server/logging/`)

**Por que `client` não pode importar `domain`?** Porque o cliente não é fonte de verdade
para regra nenhuma. Se a validação de capacidade viver no navegador, ela é contornável; se
viver nos dois lugares, ela diverge. A regra mora no domínio, o servidor a aplica, e o
cliente só apresenta o resultado.

**Por que `domain` não pode importar `node:*`?** Porque é isso que mantém os testes de regra
em milissegundos e sem banco — a condição prática do ciclo test-first que o Princípio I
exige.

## Onde colocar cada coisa

| Estou escrevendo… | Vai em… |
|---|---|
| Uma tela ou componente de convidado | `src/client/pages/` ou `src/client/components/` |
| Uma chamada HTTP a partir do cliente | `src/client/api/` |
| Uma regra de negócio de RSVP | `src/domain/rsvp/` |
| Um contrato que a persistência deve cumprir | `src/domain/ports/` |
| Uma rota HTTP | `src/server/http/` |
| Um JSON Schema de requisição/resposta | `src/server/http/schemas.ts` |
| Acesso ao banco | `src/server/persistence/` |
| Qualquer log | `src/server/logging/logger.ts` (ponto único) |
| Um tipo compartilhado entre cliente e servidor | `src/shared/contracts/` |

## Testes

| Nível | Onde | Contra o quê | Quando usar |
|---|---|---|---|
| Unidade | `tests/unit/` | Funções puras | Toda regra de domínio |
| Componente | `tests/component/` | React em jsdom | Apresentação isolada |
| Contrato | `tests/contract/` | Fastify real + SQLite real | Formato HTTP, esquema persistido, ports |
| Arquitetura | `tests/architecture/` | ESLint programático | Fronteiras entre camadas |
| E2E | `tests/e2e/` | Navegador + servidor + banco reais | Fluxo de convidado ponta a ponta |
| Gate | `tests/gate/` | O próprio `npm run verify` | Sob demanda (`npm run test:gate`) |

O projeto `gate` está **fora** de `npm run verify` de propósito: ele executa o `verify`, e
incluí-lo criaria recursão infinita.

## Regras de interface (Princípio IV)

- **Controles HTML nativos.** `<form>`, `<input>`, `<button>`, `<fieldset>`. Não construa
  widget próprio para algo que o navegador já faz — widget customizado é a origem mais comum
  de armadilha de foco e de controle inalcançável por teclado.
- **Um RSVP deve ser completável sem arrastar, sem hover e sem interação só de ponteiro.**
- **Mobile-first a partir de 320px.** Nenhuma media query pode remover funcionalidade.
- **Erros de formulário** são anunciados a tecnologia assistiva (`role="alert"`) e associados
  ao campo.
- **Foco sempre visível.** Nunca remova o outline sem substituí-lo por algo com contraste
  igual ou melhor.

A verificação automatizada (axe-core no E2E) pega tipicamente 30–40% dos problemas reais de
acessibilidade. Ela é o piso, não o teto: teclado e leitor de tela continuam sendo item de
revisão manual.

## Privacidade (Princípio III)

- Todo log passa por `src/server/logging/logger.ts`, que redige campos pessoais e tokens.
- Nenhuma mensagem de erro voltada ao usuário inclui dado pessoal, token, detalhe de banco,
  caminho de arquivo ou stack trace.
- Respostas com dado pessoal levam `Cache-Control: no-store`.
- Token inexistente e token malformado produzem **a mesma** resposta — distingui-los daria
  um oráculo de enumeração.
- Campos pessoais e suas retenções estão em [data-privacy.md](./data-privacy.md).

### Rota bloqueada

`GET /api/events/:eventId/responses` **não deve ser registrada** — nem desprotegida em
desenvolvimento — enquanto não existir autenticação de organizador. Sem ela, a rota entrega
todos os dados pessoais do evento a quem souber um `eventId`. Há um teste de contrato que
falha se a rota passar a existir.

## Portão de qualidade

`npm run verify` encadeia `format:check` → `lint` → `typecheck` → `test:unit` →
`test:component` → `test:contract` → `test:architecture` → `test:e2e`, do mais barato ao
mais caro. O CI executa **exatamente** esse script, sem lista própria de etapas — é o que
torna impossível, por construção, o portão divergir do local (FR-017).

**Teste vermelho bloqueia merge.** Pular, marcar como `skip` ou remover um teste que falha
para destravar merge é proibido pela constituição. Um teste intermitente vai para quarentena
**explícita e rastreada**: marque com `test.fixme` acompanhado de um comentário com a data e
a causa suspeita, e abra o item de trabalho correspondente. Quarentena sem rastreamento é
remoção com outro nome.

## Mudanças de estrutura

Alterar as camadas ou as arestas permitidas é mudança deliberada: atualize este documento,
`eslint.config.js` e `tests/architecture/boundaries.test.ts` no mesmo conjunto de alterações.
Reorganização ad hoc de pastas não é aceita em revisão.
