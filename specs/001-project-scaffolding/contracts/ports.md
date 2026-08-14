# Contrato de Ports (domínio ↔ persistência)

Uma *port* é uma interface **declarada pelo domínio** e **implementada pela persistência**.
É o que permite que `src/domain/` não conheça SQLite — a condição de FR-006 e a aresta que
`eslint-plugin-boundaries` fiscaliza.

A direção importa: `src/server/persistence/` importa de `src/domain/ports/`, nunca o
contrário. Se a seta se inverter, o lint reprova `npm run verify`.

---

## `InvitationRepository`

Declarada em `src/domain/ports/invitation-repository.ts`.
Implementada em `src/server/persistence/invitation-repository.sqlite.ts`.

| Operação | Entrada | Saída | Nesta feature |
|---|---|---|---|
| `findByToken` | token cru (string) | agregado do convite, ou `null` | ✅ |
| `saveResponse` | id do convite + dados da resposta | agregado atualizado | 📄 |
| `listByEvent` | id do evento | lista de agregados | 📄 |
| `purgeExpired` | instante de referência | quantidade de registros purgados | 📄 |

### Obrigações da implementação

Estas não são detalhes de implementação — são parte do contrato, e cada uma vira teste:

1. **`findByToken` recebe o token cru e faz o hash internamente.** O domínio nunca vê
   `tokenHash`, e o token cru nunca chega ao banco (R-010).
2. **`findByToken` retorna `null` para token ausente.** Não lança exceção: "não encontrado"
   é um resultado esperado do fluxo de convidado, não uma falha.
3. **`saveResponse` é atômica.** Ler o convite, validar contra `maxPartySize` e
   `rsvpDeadline`, e gravar acontecem em uma transação. Uma escrita parcial de RSVP é
   inaceitável pela constituição.
4. **Nenhum método registra dado pessoal em log**, incluindo em caminhos de erro.
5. **`purgeExpired` anula os campos pessoais preservando `status` e `partySize`**, conforme
   a transição `purge()` de [data-model.md](../data-model.md).

### O que a port deliberadamente não expõe

Sem `findAll`, sem execução de SQL arbitrário, sem paginação genérica, sem objeto de
critérios. Cada método existe porque um fluxo nomeado o exige. Adicionar um método sem
chamador é a generalidade especulativa que o Princípio V manda remover na revisão.

---

## Contratos a fixar por teste

- `findByToken` com token válido retorna o agregado correspondente.
- `findByToken` com token inexistente retorna `null` (não lança).
- `findByToken` não é satisfeito pelo `tokenHash` passado como se fosse token cru — o
  contrato é sobre o token cru.
- 📄 `saveResponse` interrompida no meio não deixa gravação parcial.
- 📄 `purgeExpired` zera campos pessoais e preserva `status` e `partySize`.

Os testes de port rodam no nível de **contrato** (`tests/contract/`), contra um arquivo
SQLite temporário e real — não contra um duplo de teste. Um repositório testado apenas contra
mock não prova nada sobre o banco, que é precisamente a lacuna que o Princípio II descreve.
