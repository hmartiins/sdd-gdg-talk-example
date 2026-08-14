# Contracts — Estrutura Inicial do Projeto

**Feature**: `001-project-scaffolding` | **Date**: 2026-08-13

O Princípio II da constituição exige que todo contrato observável externamente tenha um teste
automatizado que o fixe. Este diretório é a fonte desses contratos.

| Arquivo | Escopo |
|---|---|
| [http-api.md](./http-api.md) | Superfície HTTP entre cliente e servidor |
| [ports.md](./ports.md) | Contrato interno entre domínio e persistência |

## Status de implementação

Nem todo contrato aqui é implementado por esta feature — ver [research.md](../research.md)
R-011. A tabela abaixo é normativa: o que está marcado como contratado-não-implementado
**não deve** ganhar implementação nesta feature, e **deve** ganhar teste de contrato e
cobertura E2E na feature que o implementar.

| Contrato | Nesta feature |
|---|---|
| `GET /api/health` | ✅ implementado + teste de contrato |
| `GET /api/invitations/:token` | ✅ implementado + teste de contrato + E2E + verificação de acessibilidade |
| `PUT /api/invitations/:token/response` | 📄 contratado, não implementado |
| `GET /api/events/:eventId/responses` | 📄 contratado, não implementado |
| Port `InvitationRepository` | ✅ implementado (apenas `findByToken`) |

## Regras que valem para todo contrato deste projeto

1. **Validação nas duas direções**. Requisição e resposta são validadas por JSON Schema no
   Fastify. Validar só a entrada deixa a resposta livre para regredir silenciosamente, que é
   exatamente o que o Princípio II proíbe.
2. **Mudança de contrato atualiza o teste no mesmo conjunto de alterações.** Sem exceção.
3. **Nenhuma resposta de erro vaza dado pessoal nem informa se um token existe.** Token
   inválido e token inexistente produzem a mesma resposta (ver `http-api.md`).
4. **Os tipos TypeScript de `src/shared/contracts/` são derivados destes documentos** e são a
   única forma de o cliente conhecer o formato — o cliente nunca importa tipos de `server/`.
