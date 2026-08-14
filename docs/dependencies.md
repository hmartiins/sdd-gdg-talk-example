# Registro de Dependências

O Princípio V da constituição exige que toda dependência de execução tenha justificativa
escrita, e o Princípio III proíbe dependências de terceiros que recebam dados pessoais de
convidados. Este arquivo é onde a revisão confere as duas coisas.

**Regra**: adicionar uma dependência sem adicionar aqui a linha correspondente é motivo de
reprovação em revisão.

## Dependências de execução

| Dependência | Camada | Justificativa |
|---|---|---|
| `react`, `react-dom` | client | Framework de UI fixado pela constituição (Technology Stack) |
| `fastify` | server | Roteamento com parâmetros, validação de esquema nas duas direções e logger com redação de campos — os três mecanismos exigidos por FR-005, FR-022 e pelos contratos (research.md R-003) |
| `@fastify/static` | server | Servir o bundle do cliente pelo mesmo processo em produção, mantendo FR-001 (um único comando, um único processo) |
| `better-sqlite3` | server | Persistência durável e transacional exigida pela constituição; driver síncrono elimina uma classe de erro de concorrência no caminho de escrita do RSVP (research.md R-004) |

## Dependências de desenvolvimento

| Dependência | Propósito |
|---|---|
| `typescript`, `@types/*` | Etapa de checagem de tipos do portão (FR-016) |
| `vite`, `@vitejs/plugin-react` | Build e dev server com recarregamento automático (FR-004) |
| `vitest`, `@vitest/coverage-v8` | Testes de unidade, componente e contrato; relatório de cobertura (FR-010, FR-014) |
| `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` | Testes de componente |
| `@playwright/test` | Testes ponta a ponta contra navegador, servidor e banco reais (FR-012) |
| `@axe-core/playwright` | Verificação automatizada de acessibilidade WCAG 2.1 AA (FR-018) |
| `eslint`, `@eslint/js`, `typescript-eslint` | Análise estática (FR-016). `@eslint/js` fornece o conjunto de regras recomendadas na flat config |
| `eslint-plugin-boundaries` | Torna as direções de dependência entre camadas verificáveis; é o que faz FR-008 existir de fato |
| `eslint-plugin-jsx-a11y` | Acessibilidade estática no JSX (Princípio IV) |
| `prettier` | Formatação (FR-016) |

## Conformidade com o Princípio III

Nenhuma dependência desta lista envia dados para fora do processo. Não há cliente de
analytics, de rastreamento de erros, de e-mail ou de qualquer serviço remoto. Introduzir uma
delas exige antes verificar se dados pessoais de convidados alcançariam o terceiro — e, se
alcançarem, a constituição proíbe a adição (FR-021).

## Versões

As faixas estão em `package.json`; as versões exatas são fixadas por `package-lock.json`.
Instalar sempre com `npm ci`, nunca com `npm install`, em CI e em verificações de
reprodutibilidade (FR-019, SC-010).
