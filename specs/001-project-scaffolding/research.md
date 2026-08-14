# Phase 0 — Research: Estrutura Inicial do Projeto

**Feature**: `001-project-scaffolding` | **Date**: 2026-08-13

Este documento resolve todos os `NEEDS CLARIFICATION` do Technical Context do
[plan.md](./plan.md). A restrição dominante em quase toda decisão abaixo é a constituição
do projeto (v1.0.0), não preferência técnica.

---

## R-000: Existe backend, ou o projeto é só frontend?

**Decision**: Existe backend. A aplicação é um único processo Node servindo API HTTP +
os assets do cliente, com banco local.

**Rationale**: A constituição exige armazenamento "durável e transacional" (Technology
Stack), testes ponta a ponta "contra armazenamento real, não mocks" (Princípio II), tokens
de convite não adivinháveis (Princípio III) e que "a resposta de um convidado nunca seja
exposta a outro" (Princípio III). Nenhuma dessas quatro obrigações é satisfazível apenas no
navegador: armazenamento no cliente não é durável entre dispositivos, não é transacional
entre convidado e organizador, e não permite ocultar respostas alheias — quem controla o
cliente vê tudo que o cliente recebe. Um backend não é complexidade opcional aqui; é o
mínimo que torna os princípios verificáveis.

**Alternatives considered**:

- **Somente frontend com armazenamento no navegador**: descartado. O organizador nunca veria
  as respostas dos convidados, o que elimina um dos quatro fluxos nomeados pela constituição.
- **Backend como serviço gerenciado (BaaS)**: descartado. A constituição proíbe terceiros que
  recebam dados pessoais de convidados e exige execução local sem serviços de nuvem.

---

## R-001: Linguagem e runtime

**Decision**: TypeScript em modo `strict`, sobre Node.js 22 LTS. Versão fixada em
`.nvmrc` e em `engines` no `package.json`.

**Rationale**: A constituição já fixa React como framework de UI, o que torna o ecossistema
JavaScript a escolha governada. TypeScript em `strict` é o que transforma "checagem de tipos"
(FR-016) em um portão real em vez de decorativo, e é o que permite que os contratos entre
domínio, persistência e UI sejam verificados em tempo de build. Uma linguagem única nas duas
pontas permite compartilhar os tipos de contrato (FR-005) sem geração de código nem
duplicação — a opção mais simples que satisfaz o requisito (Princípio V).

Node 22 é LTS, com suporte estável até 2027, e `.nvmrc` + `engines` atendem FR-002 (falha
legível quando a versão não bate) sem ferramenta adicional.

**Alternatives considered**:

- **JavaScript puro**: descartado. FR-016 exige checagem de tipos como etapa do portão;
  sem tipos, essa etapa não existe.
- **Node 24**: descartado por ora. Ganho nulo para este escopo e menor maturidade de
  ferramental que o LTS.
- **Backend em outra linguagem (Go, Python)**: descartado. Dobraria a superfície de
  ferramental, testes e CI para um projeto de um único fluxo de evento (Princípio V).

---

## R-002: Framework de UI e ferramenta de build

**Decision**: React 19 com Vite 7. O dev server do Vite faz proxy de `/api` para o processo
Node; em produção o Node serve o bundle estático gerado pelo Vite.

**Rationale**: Decisão já governada pela constituição ("React (vite)"). Vite entrega o
recarregamento automático de FR-004 sem configuração, e seu proxy de desenvolvimento permite
um único comando de execução (FR-001) sem CORS, sem gateway e sem uma segunda origem.

Nota de acessibilidade: o Princípio IV exige que um RSVP seja completável sem interações
dependentes de ponteiro. Isso é atendido usando `<form>` com submit nativo e elementos
HTML nativos (`<input>`, `<button>`, `<fieldset>`) em vez de widgets customizados — uma
regra de arquitetura registrada em `docs/architecture.md`, não uma biblioteca.

**Alternatives considered**:

- **Next.js**: descartado. Traria roteamento de servidor, renderização híbrida e um modelo
  de build que este escopo não usa — complexidade sem requisito que a sustente (Princípio V).
- **Biblioteca de componentes (MUI, Chakra)**: descartado nesta estrutura inicial. Nenhum
  requisito atual a exige, e widgets prontos tendem a produzir exatamente os controles
  não nativos que o Princípio IV restringe. Pode ser reavaliada quando houver telas reais.

---

## R-003: Servidor HTTP

**Decision**: Fastify 5.

**Rationale**: São necessários três recursos que o `node:http` puro não dá de graça e que
requisitos explícitos exigem: roteamento com parâmetros de caminho (contratos de
`/api/invitations/:token`), validação de esquema de requisição/resposta (FR-005, contratos
testáveis) e um logger estruturado com redação configurável de campos — que é exatamente o
mecanismo de FR-022 (nenhum dado pessoal em log). Fastify traz os três em uma dependência,
com validação por JSON Schema que serve simultaneamente como o contrato versionado.

**Alternatives considered**:

- **Express 5**: descartado. Exigiria somar validação e logger como dependências separadas,
  resultando em mais superfície, não menos.
- **`node:http` puro**: descartado. Roteamento, validação e redação de log seriam código
  próprio a manter e testar — mais complexo que a dependência que substitui.
- **Hono**: comparável e igualmente defensável; Fastify foi escolhido pela redação de PII
  no logger vir pronta e por validação de resposta (não só de requisição), que é o que faz
  o contrato ser pinado nas duas direções (Princípio II).

---

## R-004: Armazenamento

**Decision**: SQLite via `better-sqlite3`, com `journal_mode = WAL` e `foreign_keys = ON`.
Migrações como arquivos SQL numerados em `db/migrations/`, aplicadas por um runner próprio
de ~40 linhas.

**Rationale**: A constituição exige durabilidade e transacionalidade, e execução local sem
serviço de nuvem. SQLite é transacional (ACID), é um arquivo — o que torna o banco de teste
trivialmente isolado e descartável por execução (FR-012, caso de borda de teste interrompido)
— e não requer processo, container ou credencial. `better-sqlite3` é síncrono, o que elimina
toda uma classe de erro de concorrência mal escrita no caminho de escrita do RSVP, que é
justamente o caminho que a constituição diz não poder perder dado.

Migrações como SQL numerado e um runner próprio são deliberadamente menos ferramenta que uma
biblioteca de migração: o projeto tem um esquema pequeno e nenhum requisito de rollback
automático. Se isso mudar, a decisão é revisitável.

**Alternatives considered**:

- **PostgreSQL**: descartado. Violaria "roda localmente sem serviços externos" ou exigiria
  Docker como pré-requisito, contra FR-001 e SC-001.
- **ORM (Prisma, Drizzle)**: descartado nesta estrutura. Prisma adiciona etapa de geração ao
  build e um runtime pesado; Drizzle é mais leve mas ainda é uma camada de abstração sem um
  requisito atual que a justifique (Princípio V). O acesso a dados fica confinado a um único
  módulo de repositório, então trocar por um ORM depois é uma mudança local, não global.
- **Arquivos JSON**: descartado. Não é transacional; um RSVP concorrente pode ser perdido.

---

## R-005: Ferramentas de teste (três níveis)

**Decision**:

| Nível | Ferramenta | Escopo |
|---|---|---|
| Unidade | Vitest 3 | Funções de domínio puras; sem I/O, sem DOM |
| Componente | Vitest 3 + React Testing Library + `jsdom` | Componentes de UI isolados |
| Contrato | Vitest 3 + `fastify.inject()` + SQLite temporário | Formatos de requisição/resposta e esquema persistido |
| Ponta a ponta | Playwright 1.5x | Navegador real contra servidor real e banco real |

**Rationale**: Vitest compartilha a resolução de módulos e a configuração do Vite, o que
significa uma configuração de build em vez de duas, e execução de unidade em segundo
fracionado — o que viabiliza o ciclo Red-Green-Refactor do Princípio I e o alvo de 30s de
SC-003. `fastify.inject()` exercita o pipeline HTTP completo sem abrir socket, tornando
testes de contrato rápidos o bastante para rodar a cada salvamento, mas ainda reais.

Playwright é o nível que cumpre a exigência mais dura do Princípio II — fluxo de convidado
ponta a ponta contra armazenamento real. Cada worker recebe um arquivo SQLite próprio em
diretório temporário, o que dá isolamento e descarte por execução sem código de limpeza.

**Alternatives considered**:

- **Jest**: descartado. Exigiria uma segunda cadeia de transformação de módulos paralela à
  do Vite, com custo de manutenção e divergência de comportamento entre teste e build.
- **Cypress**: descartado. Playwright cobre múltiplos navegadores em um único runner e traz
  integração direta com o verificador de acessibilidade (ver R-006).
- **Fundir contrato e E2E em um nível só**: descartado. Testes de contrato precisam rodar em
  segundos para servirem ao ciclo test-first; E2E não roda nessa velocidade.

---

## R-006: Acessibilidade automatizada (FR-018)

**Decision**: `@axe-core/playwright`, executado contra cada página voltada ao convidado
dentro da suíte E2E. Qualquer violação de nível A ou AA reprova o teste.

**Rationale**: O Princípio IV exige WCAG 2.1 AA. axe-core é a implementação de referência
dessas regras, e rodá-lo dentro do Playwright significa auditar a página realmente
renderizada — com CSS e estado aplicados — e não uma aproximação em jsdom, onde contraste e
foco não existem de verdade.

Limite honesto, registrado aqui de propósito: verificação automatizada captura tipicamente
30–40% dos problemas reais de acessibilidade. Ela não substitui teclado e leitor de tela; é
o piso que impede regressões óbvias. `docs/architecture.md` registra a verificação manual
como parte da revisão, conforme o Workflow da constituição.

**Alternatives considered**:

- **`jest-axe`/`vitest-axe` em jsdom**: mantido como complemento opcional, não como o
  mecanismo principal — jsdom não computa layout nem contraste.
- **Somente revisão manual**: descartado. FR-018 exige verificação como parte da suíte.

---

## R-007: Direções de dependência verificáveis (FR-006, FR-008)

**Decision**: ESLint 9 (flat config) com `eslint-plugin-boundaries`, declarando quatro
camadas e as arestas permitidas entre elas. Violação é `error`, logo reprova `npm run verify`.

Arestas permitidas:

```
client  →  shared
server  →  domain, shared
domain  →  shared
shared  →  (nada)
```

Proibido explicitamente: `domain → client`, `domain → server`, `client → server`,
`client → domain`, e qualquer import de `node:*` ou de driver de banco dentro de `domain`.

**Rationale**: FR-008 exige que a direção de dependência seja *verificável automaticamente*,
não apenas documentada. Um documento de arquitetura sem verificação degrada em semanas.
`eslint-plugin-boundaries` expressa a regra como dado no mesmo arquivo de configuração que
já roda no portão, sem etapa nova no pipeline.

O `domain` não importar `server` é o que dá sentido ao Princípio II: as regras de RSVP ficam
testáveis por testes de unidade puros, sem banco, enquanto os contratos ficam testáveis
contra o banco real. A regra `domain` não conhecer `node:*` é o que impede que um detalhe de
infraestrutura entre por acidente.

**Alternatives considered**:

- **Pacotes separados em monorepo (workspaces)**: alcançaria o mesmo isolamento via
  `package.json`, mas custa múltiplos manifestos, configuração de build por pacote e
  resolução de dependências entre eles — complexidade sem requisito que a sustente
  (Princípio V). Uma pasta com regra de lint entrega o mesmo veredito.
- **`import/no-restricted-paths` do eslint-plugin-import**: funciona, mas expressa camadas
  como padrões de caminho soltos, que degradam conforme a árvore cresce.
- **Revisão humana apenas**: reprovado diretamente por FR-008.

---

## R-008: Portão único de verificação (FR-016, FR-017)

**Decision**: `npm run verify` = `format:check` → `lint` → `typecheck` → `test:unit` →
`test:contract` → `test:e2e`. Um único script, na ordem do mais rápido para o mais lento. O
CI executa exatamente `npm run verify`, sem passos próprios.

**Rationale**: FR-017 exige que local e portão não divirjam. A única forma robusta de
garantir isso é o CI não ter uma lista própria de etapas: se ele roda o mesmo script, a
divergência é impossível por construção, não por disciplina. A ordem do mais barato ao mais
caro faz o feedback chegar em segundos no caso comum.

Ferramentas: Prettier (formatação), ESLint 9 (análise estática), `tsc --noEmit` (tipos),
Vitest e Playwright (testes), cobertura via `@vitest/coverage-v8` (FR-014).

**Alternatives considered**:

- **Etapas paralelas no CI com lista própria**: descartado. É exatamente a divergência que
  FR-017 proíbe.
- **Biome no lugar de ESLint + Prettier**: mais rápido e uma dependência a menos, mas sem
  equivalente maduro ao `eslint-plugin-boundaries`, que é o que torna FR-008 verificável.
  A verificabilidade da arquitetura pesou mais que a velocidade do linter.

---

## R-009: Log sem dados pessoais (FR-022)

**Decision**: Um único módulo de log exportado (`src/server/logging/`), envolvendo o logger
do Fastify (Pino) com uma lista de redação de campos (`name`, `email`, `phone`,
`dietaryNotes`, `accessibilityNotes`, `token`). ESLint proíbe `console.*` em `src/server/`.
Um teste de contrato captura a saída de log durante um fluxo de RSVP e falha se qualquer
valor pessoal semeado aparecer nela.

**Rationale**: O Princípio III proíbe dado pessoal em log, e SC-008 exige verificação. Um
único ponto de saída é o que torna a regra aplicável — com `console.log` espalhado não há
onde redigir. A redação por caminho de campo do Pino cobre o caso comum (objeto logado
inteiro); o teste de captura de saída cobre o caso que a redação não pega — interpolação de
string. Os dois juntos são o que transforma SC-008 em asserção.

Nota: tokens de convite são tratados como dado sensível na redação — um token em log é
acesso permanente ao convite (Princípio III).

**Alternatives considered**:

- **Confiar apenas em revisão de código**: descartado. SC-008 exige verificação executável.
- **Varredura por regex no código-fonte**: descartado. Ruidosa e trivial de contornar; o
  teste sobre a saída real mede o que importa.

---

## R-010: Tokens de convite não adivinháveis (FR-024)

**Decision**: 32 bytes de `node:crypto.randomBytes`, codificados em base64url (43
caracteres). Gerados apenas no servidor. A busca por token usa comparação em tempo constante
somente no ponto de verificação; o índice do banco é sobre o hash do token, não sobre o token.

**Rationale**: O Princípio III exige token não adivinhável em vez de identificador
sequencial. 256 bits de entropia de CSPRNG torna a enumeração inviável. Armazenar o hash em
vez do token cru significa que um vazamento do banco não entrega acesso aos convites — o
mesmo raciocínio aplicado a credenciais, pelo mesmo motivo.

**Alternatives considered**:

- **UUIDv4**: 122 bits, suficiente na prática, mas frequentemente confundido com
  identificador público e às vezes gerado por fonte não criptográfica. `randomBytes` deixa a
  propriedade explícita.
- **Guardar o token em claro**: descartado; perde a proteção contra vazamento do banco sem
  ganho de simplicidade relevante.

---

## R-011: Escopo da fatia vertical implementada nesta estrutura

**Decision**: A estrutura inicial implementa **uma fatia vertical fina**:
`GET /api/health`, `GET /api/invitations/:token` e a página de convite correspondente — o
suficiente para que exista um teste real de cada nível (unidade, contrato, E2E) exercitando
todas as camadas. Envio de RSVP, alteração e visão do organizador são **contratados** em
[contracts/](./contracts/) mas **não implementados** aqui.

**Rationale**: FR-013 exige um exemplo executável de cada nível de teste, e exemplos só são
replicáveis se atravessarem o caminho real (UI → HTTP → domínio → banco). Ao mesmo tempo,
FR-009 pede que a estrutura *acomode* os quatro fluxos sem reorganização — acomodar não é
implementar. Escrever os quatro fluxos agora seria construir a funcionalidade sob o disfarce
de estrutura, sem uma spec de produto que os defina (Princípio V).

**Alternatives considered**:

- **Nenhuma fatia vertical (só pastas vazias e testes de brinquedo)**: descartado. Um teste
  de exemplo que não atravessa camadas não prova que a estrutura funciona, e SC-005/SC-006
  ficariam sem sustentação.
- **Implementar os quatro fluxos**: descartado. Excede o escopo declarado da spec.

---

## Resumo das dependências de execução

Cada linha precisa de justificativa por FR-020 e pelo Princípio V. Nenhuma recebe dados
pessoais de convidados; nenhuma envia dados para fora (FR-021).

| Dependência | Camada | Justificativa |
|---|---|---|
| `react`, `react-dom` | client | Governado pela constituição |
| `vite`, `@vitejs/plugin-react` | build | Governado pela constituição; FR-004 |
| `fastify` | server | Roteamento, validação de contrato, redação de log (R-003) |
| `@fastify/static` | server | Servir o bundle em produção com um único processo (FR-001) |
| `better-sqlite3` | server | Persistência durável e transacional (R-004) |
| `typescript` | build | Etapa de tipos do portão (FR-016) |
| `vitest`, `@vitest/coverage-v8` | test | Unidade e contrato; cobertura (FR-014) |
| `@testing-library/react`, `jsdom` | test | Testes de componente |
| `@playwright/test` | test | E2E contra navegador e banco reais (FR-012) |
| `@axe-core/playwright` | test | Acessibilidade automatizada (FR-018) |
| `eslint`, `typescript-eslint` | lint | Análise estática (FR-016) |
| `eslint-plugin-boundaries` | lint | Direções de dependência verificáveis (FR-008) |
| `eslint-plugin-jsx-a11y` | lint | Acessibilidade estática no JSX (Princípio IV) |
| `prettier` | lint | Formatação (FR-016) |

Versões exatas são fixadas pelo lockfile no momento da implementação (FR-019); este documento
registra a linha maior de cada uma.

---

## NEEDS CLARIFICATION restantes

Nenhum. Todas as incógnitas do Technical Context foram resolvidas acima.
