# Phase 1 — Data Model: Estrutura Inicial do Projeto

**Feature**: `001-project-scaffolding` | **Date**: 2026-08-13

O esquema abaixo é o mínimo que sustenta os quatro fluxos nomeados pela constituição. Apenas
as tabelas `event` e `invitation` são criadas e exercitadas pela fatia vertical desta feature
(ver [research.md](./research.md) R-011); `rsvp_response` é definida aqui porque o modelo de
retenção e privacidade não faz sentido em pedaços, mas sua migração pertence à feature que
implementar o envio de RSVP.

Cada campo pessoal traz **Propósito** e **Retenção** — obrigatório pelo Princípio III e por
FR-023. Campos sem propósito declarado não entram no esquema.

---

## Entidade: `event`

O evento para o qual se convida. Uma instância da aplicação atende um evento.

| Campo | Tipo | Restrições | Notas |
|---|---|---|---|
| `id` | TEXT | PK | ULID; interno, nunca exposto em URL de convidado |
| `name` | TEXT | NOT NULL | Nome do evento |
| `starts_at` | TEXT | NOT NULL | ISO-8601 UTC |
| `rsvp_deadline` | TEXT | NOT NULL | ISO-8601 UTC; após esta data, respostas não podem ser criadas nem alteradas |
| `retention_until` | TEXT | NOT NULL | ISO-8601 UTC; data a partir da qual dados pessoais dos convidados deste evento devem ser purgáveis |
| `created_at` | TEXT | NOT NULL | ISO-8601 UTC |

Não contém dado pessoal.

**Regras de validação** (aplicadas no domínio, não só no banco):

- `rsvp_deadline` ≤ `starts_at`.
- `retention_until` > `starts_at`.

---

## Entidade: `invitation`

O convite endereçado a um convidado. É o que o token de convite resolve.

| Campo | Tipo | Restrições | Pessoal? | Notas |
|---|---|---|---|---|
| `id` | TEXT | PK | não | ULID interno |
| `event_id` | TEXT | NOT NULL, FK → `event.id` | não | |
| `token_hash` | BLOB | NOT NULL, UNIQUE | sensível | SHA-256 do token; o token cru **nunca** é persistido (R-010) |
| `guest_name` | TEXT | NOT NULL | **sim** | |
| `guest_email` | TEXT | NULL | **sim** | |
| `max_party_size` | INTEGER | NOT NULL, ≥ 1 | não | Quantas pessoas este convite pode confirmar |
| `created_at` | TEXT | NOT NULL | não | |

**Propósito e retenção dos campos pessoais** (FR-023):

| Campo | Propósito | Retenção |
|---|---|---|
| `guest_name` | Endereçar o convite e identificar a resposta na lista do organizador | Até `event.retention_until` |
| `guest_email` | Enviar o link do convite e um comprovante da resposta | Até `event.retention_until` |
| `token_hash` | Autorizar o acesso ao convite sem exigir conta | Até `event.retention_until` |

**Regras de validação**:

- `guest_name` não vazio após remoção de espaços; máximo 200 caracteres.
- `guest_email`, quando presente, deve ter formato de e-mail; máximo 320 caracteres.
- `max_party_size` entre 1 e 20.

**Índices**: `UNIQUE(token_hash)` — é o caminho de busca da rota de convite.

**Nota de privacidade**: a busca é feita por `token_hash`, então um token válido é necessário
para localizar qualquer registro. Não existe caminho de listagem de convites acessível a
convidado (Princípio III).

---

## Entidade: `rsvp_response`

A resposta do convidado. **Definida, não implementada nesta feature.**

| Campo | Tipo | Restrições | Pessoal? | Notas |
|---|---|---|---|---|
| `id` | TEXT | PK | não | ULID |
| `invitation_id` | TEXT | NOT NULL, UNIQUE, FK → `invitation.id` | não | Uma resposta por convite; alterar atualiza a mesma linha |
| `status` | TEXT | NOT NULL, CHECK IN (`attending`, `not_attending`) | não | |
| `party_size` | INTEGER | NOT NULL, ≥ 0 | não | 0 quando `not_attending`; ≤ `invitation.max_party_size` quando `attending` |
| `dietary_notes` | TEXT | NULL | **sim** | |
| `accessibility_notes` | TEXT | NULL | **sim** | |
| `submitted_at` | TEXT | NOT NULL | não | Primeira submissão |
| `updated_at` | TEXT | NOT NULL | não | Última alteração |

**Propósito e retenção dos campos pessoais**:

| Campo | Propósito | Retenção |
|---|---|---|
| `dietary_notes` | Permitir ao organizador planejar alimentação | Até `event.retention_until` |
| `accessibility_notes` | Permitir ao organizador providenciar acomodações | Até `event.retention_until` |

**Regras de validação**:

- `status = not_attending` ⇒ `party_size = 0`.
- `status = attending` ⇒ `1 ≤ party_size ≤ invitation.max_party_size`.
- `dietary_notes` e `accessibility_notes`: máximo 1000 caracteres cada.
- Criação e alteração só são aceitas enquanto `now < event.rsvp_deadline`.

---

## Transições de estado da resposta

```text
(sem resposta)
      │  submit(status, party_size, notes)          [now < rsvp_deadline]
      ▼
   respondida ──── amend(status, party_size, notes) [now < rsvp_deadline] ──┐
      │  ▲                                                                  │
      │  └──────────────────────────────────────────────────────────────────┘
      │
      │  purge()                                    [now ≥ retention_until]
      ▼
   purgada (campos pessoais nulos; contagem preservada)
```

Regras:

- Não há transição de volta para "sem resposta": uma vez respondida, altera-se, não se apaga.
- Toda submissão e alteração ocorre em uma **única transação** que lê o convite, valida contra
  `max_party_size` e `rsvp_deadline`, e grava — a constituição não admite perder um RSVP.
- `purge()` anula `guest_name`, `guest_email`, `dietary_notes` e `accessibility_notes`,
  preservando `status` e `party_size` para que a contagem histórica do evento sobreviva sem
  dado pessoal.

---

## Mapeamento para as entidades da spec

A spec descreve as entidades em termos de estrutura de projeto; este documento as concretiza:

| Entidade da spec | Realização |
|---|---|
| Módulo de Domínio | `src/domain/rsvp/` — regras acima, sem I/O |
| Módulo de Persistência | `src/server/persistence/` — implementa `src/domain/ports/` |
| Módulo de Interface | `src/client/` — consome os tipos de `src/shared/contracts/` |
| Suíte de Testes | `tests/{unit,component,contract,e2e}/` |
| Documento de Arquitetura | `docs/architecture.md` |
| Registro de Dependências | `docs/dependencies.md` |

Os campos pessoais e suas retenções são replicados em `docs/data-privacy.md`, que é o
artefato consultado em revisão (FR-023, SC-009). Este documento é a fonte; aquele é a
apresentação.
