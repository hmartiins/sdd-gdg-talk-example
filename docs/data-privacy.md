# Dados Pessoais: Propósito e Retenção

O Princípio III da constituição exige que **todo** campo pessoal armazenado tenha propósito
documentado e limite de retenção documentado, e que dados além do limite sejam removíveis por
uma operação suportada.

Este arquivo é o que a revisão consulta. A fonte formal do esquema é
[`specs/001-project-scaffolding/data-model.md`](../specs/001-project-scaffolding/data-model.md);
aqui está a apresentação usada em revisão.

**Regra**: adicionar um campo pessoal sem adicionar sua linha aqui é motivo de reprovação.

## Campos pessoais armazenados

### `invitation`

| Campo | Propósito | Retenção |
|---|---|---|
| `guest_name` | Endereçar o convite e identificar a resposta na lista do organizador | Até `event.retention_until` |
| `guest_email` | Enviar o link do convite e um comprovante da resposta | Até `event.retention_until` |
| `token_hash` | Autorizar o acesso ao convite sem exigir conta | Até `event.retention_until` |

### `rsvp_response` — definida, ainda não implementada

| Campo | Propósito | Retenção |
|---|---|---|
| `dietary_notes` | Permitir ao organizador planejar a alimentação | Até `event.retention_until` |
| `accessibility_notes` | Permitir ao organizador providenciar acomodações | Até `event.retention_until` |

`event.retention_until` é definido por evento e obrigatoriamente posterior a `starts_at`.

## O que NÃO é coletado

Deliberadamente ausentes, porque nenhum requisito atual os justifica: telefone, endereço,
data de nascimento, documento, foto, endereço IP e qualquer identificador de dispositivo.
O Princípio III manda coletar apenas o que o organizador demonstravelmente precisa —
adicionar um destes exige justificar o requisito antes do campo.

## Purga

A operação `purgeExpired` (contratada em
[`contracts/ports.md`](../specs/001-project-scaffolding/contracts/ports.md), ainda não
implementada) anula `guest_name`, `guest_email`, `dietary_notes` e `accessibility_notes`
preservando `status` e `party_size` — a contagem histórica do evento sobrevive sem dado
pessoal.

## Garantias em vigor

| Garantia | Onde é aplicada | Onde é verificada |
|---|---|---|
| Nenhum dado pessoal em log | `src/server/logging/logger.ts` (redação) + proibição de `console.*` | `tests/contract/logging-privacy.contract.test.ts` |
| Nenhum token em log | Mesma lista de redação; serializador registra a rota, não a URL | Idem |
| Token não adivinhável | 32 bytes de CSPRNG, base64url | `tests/unit/server/invite-token.test.ts` |
| Token cru nunca persistido | Apenas SHA-256 vai ao banco | `tests/contract/invitation-repository.contract.test.ts` |
| Resposta não expõe outros convidados | A rota devolve só o convite do token | `tests/contract/invitations.contract.test.ts` |
| Resposta não expõe identificadores internos | `additionalProperties: false` nos esquemas de resposta | Idem |
| Sem cache de resposta com dado pessoal | `Cache-Control: no-store` | Idem |
| Token inexistente e malformado são indistinguíveis | Ambos produzem o mesmo 404 | Idem |
| Erros não vazam detalhe interno | Handler de erro genérico | Idem |

## Terceiros

Nenhuma dependência recebe dados pessoais de convidados. Não há analytics, rastreador de
erros, cliente de e-mail ou serviço remoto no projeto. Introduzir qualquer um exige verificar
antes se dados pessoais o alcançariam — se alcançarem, a constituição proíbe a adição
(FR-021). Ver [dependencies.md](./dependencies.md).

## Pendências conhecidas

- `purgeExpired` está contratada mas não implementada. Enquanto isso, a retenção é uma
  política declarada sem mecanismo de execução — pertence à feature que implementar o envio
  de RSVP, junto com a tabela `rsvp_response`.
- `GET /api/events/:eventId/responses` está bloqueada até existir autenticação de
  organizador (ver [architecture.md](./architecture.md)).
