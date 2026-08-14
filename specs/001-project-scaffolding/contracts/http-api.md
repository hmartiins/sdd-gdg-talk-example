# Contrato HTTP

**Base**: `/api` · **Formato**: JSON (`application/json; charset=utf-8`) · **Datas**: ISO-8601 UTC

Em desenvolvimento, o dev server do Vite faz proxy de `/api` para o processo Node; em
produção o mesmo processo serve API e assets. O cliente sempre usa caminhos relativos — não
existe URL de API configurável, porque não existe segunda origem.

---

## Formato de erro (comum a todas as rotas)

```json
{
  "error": {
    "code": "invitation_not_found",
    "message": "Não foi possível encontrar este convite."
  }
}
```

- `code`: identificador estável, em `snake_case`. É o que os testes asseveram.
- `message`: texto voltado ao usuário final. **Nunca** contém dado pessoal, valor de token,
  detalhe de banco, caminho de arquivo ou stack trace (Princípio III).
- Nenhuma resposta de erro inclui campos adicionais em produção.

---

## `GET /api/health`

Verificação de vitalidade do processo e da conexão com o banco. Usada pelo Playwright para
saber quando o servidor subiu.

**Resposta `200`**

```json
{ "status": "ok", "checks": { "database": "ok" } }
```

**Resposta `503`** — banco inacessível ou migrações não aplicadas

```json
{ "status": "degraded", "checks": { "database": "unavailable" } }
```

Não requer autenticação e não expõe versão, caminho de banco nem variáveis de ambiente.

---

## `GET /api/invitations/:token`

Resolve um token de convite para o convite correspondente. É o ponto de entrada do convidado.

**Parâmetro de caminho**

| Nome | Formato |
|---|---|
| `token` | base64url, 43 caracteres, `^[A-Za-z0-9_-]{43}$` |

**Resposta `200`**

```json
{
  "invitation": {
    "guestName": "Ana Ribeiro",
    "maxPartySize": 2
  },
  "event": {
    "name": "Casamento de Ana e Bruno",
    "startsAt": "2026-11-14T21:00:00Z",
    "rsvpDeadline": "2026-10-31T23:59:59Z"
  },
  "response": null
}
```

- `response` é `null` enquanto não houver resposta; quando houver, assume o formato do corpo
  de `PUT .../response` acrescido de `submittedAt` e `updatedAt`.
- A resposta contém **apenas** o convite deste token. Nenhuma contagem do evento, nenhuma
  lista de convidados, nenhum identificador interno (`id`, `eventId`) é exposto — o convidado
  não deve poder inferir nada sobre os demais (Princípio III).

**Resposta `404`** — `code: "invitation_not_found"`

Retornada tanto para token inexistente quanto para token com formato inválido. A distinção
não é observável de fora: informar "formato inválido" versus "não encontrado" entregaria um
oráculo de enumeração.

**Cabeçalhos**: `Cache-Control: no-store` — a resposta contém dado pessoal e não deve ser
armazenada por intermediários nem pelo navegador.

---

## `PUT /api/invitations/:token/response` 📄 *contratado, não implementado*

Cria ou substitui a resposta do convite. `PUT` e não `POST`: o convidado tem no máximo uma
resposta, e reenviar o mesmo corpo produz o mesmo estado — a alteração usa exatamente a mesma
rota que a criação.

**Corpo**

```json
{
  "status": "attending",
  "partySize": 2,
  "dietaryNotes": "vegetariana",
  "accessibilityNotes": null
}
```

| Campo | Regra |
|---|---|
| `status` | `"attending"` ou `"not_attending"` |
| `partySize` | inteiro; `0` se `not_attending`; entre 1 e `maxPartySize` se `attending` |
| `dietaryNotes` | opcional, ≤ 1000 caracteres |
| `accessibilityNotes` | opcional, ≤ 1000 caracteres |

**Resposta `200`**: o mesmo corpo de `GET /api/invitations/:token`, com `response` preenchido.

**Erros**

| Status | `code` | Quando |
|---|---|---|
| `400` | `validation_failed` | Corpo fora do esquema |
| `404` | `invitation_not_found` | Token inválido ou inexistente |
| `409` | `party_size_exceeded` | `partySize` acima de `maxPartySize` |
| `409` | `rsvp_deadline_passed` | `now ≥ event.rsvp_deadline` |

A leitura do convite, a validação e a gravação ocorrem em uma **única transação** — a
constituição não admite perder um RSVP submetido, nem aceitá-lo com base em estado obsoleto.

---

## `GET /api/events/:eventId/responses` 📄 *contratado, não implementado*

Visão do organizador. Retorna todos os convites do evento com suas respostas.

**Exige autenticação de organizador.** O mecanismo não é definido nesta feature e é
pré-requisito bloqueante para implementá-la: sem ele, esta rota expõe todos os dados pessoais
do evento a quem souber um `eventId`, violando o Princípio III. Enquanto a autenticação não
existir, a rota não deve ser registrada — nem mesmo desprotegida em desenvolvimento.

---

## Contratos a fixar por teste

Cada item abaixo vira uma asserção em `tests/contract/`. Os marcados 📄 pertencem à feature
que implementar a rota correspondente.

- `GET /api/health` retorna `200` com `status: "ok"` quando as migrações estão aplicadas.
- `GET /api/health` retorna `503` quando o banco está indisponível.
- `GET /api/invitations/:token` com token válido retorna `200` e o esquema exato acima.
- A resposta de `GET /api/invitations/:token` **não** contém `id`, `eventId`, `token` nem
  `tokenHash` — asserção sobre o conjunto de chaves, não apenas sobre as presentes.
- `GET /api/invitations/:token` com token inexistente retorna `404 invitation_not_found`.
- `GET /api/invitations/:token` com token malformado retorna `404` com o **mesmo** corpo do
  caso inexistente.
- Toda resposta com dado pessoal traz `Cache-Control: no-store`.
- Durante um ciclo completo de requisição, nenhum valor pessoal semeado aparece na saída de
  log (SC-008).
- 📄 `PUT .../response` rejeita `partySize` acima de `maxPartySize` com `409`.
- 📄 `PUT .../response` rejeita submissão após o prazo com `409`.
- 📄 `PUT .../response` aplicado duas vezes com o mesmo corpo deixa o mesmo estado final.
