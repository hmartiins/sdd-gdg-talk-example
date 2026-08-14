# Feature Specification: Estrutura Inicial do Projeto

**Feature Branch**: `001-project-scaffolding`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Crie uma espcificação da estrutura inicial do projeto, pastas, arquitetura, testes, bibliotecas.."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rodar o projeto com um único comando (Priority: P1)

Uma pessoa desenvolvedora clona o repositório pela primeira vez, executa o comando de instalação documentado e o comando de execução documentado, e vê a aplicação rodando localmente no navegador — sem precisar de nenhum serviço de nuvem, credencial ou configuração manual adicional.

**Why this priority**: Sem isso, nada mais pode ser construído ou verificado. É o menor incremento que já entrega valor real: um projeto executável.

**Independent Test**: Em uma máquina limpa (ou clone novo), seguir apenas o README e confirmar que a aplicação abre no navegador e exibe uma página inicial.

**Acceptance Scenarios**:

1. **Given** um clone novo do repositório sem dependências instaladas, **When** a pessoa executa o comando de instalação e depois o comando de execução documentados no README, **Then** a aplicação fica acessível localmente e exibe uma página inicial funcional.
2. **Given** a aplicação rodando localmente, **When** a pessoa edita um arquivo de interface e salva, **Then** a mudança aparece no navegador sem reinício manual do processo.
3. **Given** um clone novo, **When** a pessoa lê o README, **Then** encontra, em um único lugar, os comandos de instalação, execução, teste e verificação de qualidade.

---

### User Story 2 - Escrever um teste antes de escrever código (Priority: P1)

Uma pessoa desenvolvedora precisa iniciar qualquer funcionalidade pelo teste, como exige a constituição do projeto. Ela cria um teste novo no local convencionado, executa a suíte, vê o teste falhar pelo motivo esperado, implementa e vê passar.

**Why this priority**: Test-First é NON-NEGOTIABLE na constituição. Se a estrutura não permitir escrever e rodar testes desde o primeiro dia, toda funcionalidade subsequente já nasce violando a governança.

**Independent Test**: Adicionar um teste deliberadamente falho, rodar o comando de teste, confirmar falha com mensagem legível; corrigir e confirmar sucesso.

**Acceptance Scenarios**:

1. **Given** o projeto recém-instalado, **When** a pessoa executa o comando de teste documentado, **Then** a suíte roda até o fim e reporta resultado (verde) sem configuração adicional.
2. **Given** um teste que falha propositalmente, **When** a suíte é executada, **Then** o processo termina com código de saída diferente de zero e aponta arquivo e linha da falha.
3. **Given** a estrutura de pastas do projeto, **When** a pessoa procura onde colocar um teste de unidade, um teste de contrato ou um teste ponta a ponta, **Then** cada um dos três tipos tem um local convencionado e documentado.
4. **Given** um teste ponta a ponta de um fluxo de convidado, **When** ele é executado, **Then** ele exercita a aplicação real e o armazenamento real, sem substituir a camada de persistência por mocks.

---

### User Story 3 - Saber onde cada coisa mora (Priority: P2)

Uma pessoa desenvolvedora (ou um agente) precisa adicionar uma nova tela de convidado, uma nova regra de negócio e um novo acesso a dados. Ela consegue determinar, a partir da estrutura documentada, em qual pasta cada peça vai — e a estrutura impede que a regra de negócio dependa de detalhes de interface ou de armazenamento.

**Why this priority**: Depende da base executável (P1), mas é o que mantém o projeto coerente conforme cresce. Sem convenção explícita, cada funcionalidade inventa a sua.

**Independent Test**: Pedir a duas pessoas diferentes que indiquem onde colocaria cada uma de três peças (tela, regra, acesso a dados) lendo apenas o documento de arquitetura; as respostas coincidem.

**Acceptance Scenarios**:

1. **Given** o documento de arquitetura, **When** a pessoa precisa adicionar uma regra de negócio de RSVP, **Then** o documento indica sem ambiguidade a camada e a pasta de destino.
2. **Given** o código do domínio (regras de RSVP), **When** ele é inspecionado, **Then** ele não referencia componentes de interface nem detalhes do mecanismo de armazenamento.
3. **Given** uma tentativa de importar interface a partir do domínio, **When** a verificação automatizada de qualidade roda, **Then** a violação é reportada como erro.

---

### User Story 4 - Falhar cedo antes do merge (Priority: P2)

Uma pessoa desenvolvedora executa um único comando de verificação que roda formatação, análise estática, checagem de tipos e a suíte de testes, e obtém um veredito único de aprovado/reprovado — o mesmo veredito que o portão de qualidade aplicaria.

**Why this priority**: A constituição bloqueia merge com suíte vermelha. O feedback precisa ser obtenível localmente, senão o portão só reprova tarde.

**Independent Test**: Introduzir uma violação de estilo, uma de tipo e um teste falho; confirmar que o comando único reprova e nomeia cada problema.

**Acceptance Scenarios**:

1. **Given** o projeto em estado íntegro, **When** o comando único de verificação roda, **Then** ele termina com sucesso e reporta cada etapa executada.
2. **Given** qualquer violação de estilo, tipo ou teste, **When** o comando único roda, **Then** ele termina com falha e identifica a etapa e o arquivo responsáveis.

---

### User Story 5 - Confiar que dados de convidado não vazam (Priority: P3)

Uma pessoa desenvolvedora precisa registrar um erro que ocorreu durante o envio de um RSVP. A estrutura oferece um caminho padrão de log que não aceita dados pessoais de convidado, e há verificação que sinaliza tentativas de registrar esses campos.

**Why this priority**: Privacidade é principio constitucional, mas depende de existir aplicação e camada de dados; é o último dos incrementos estruturais.

**Independent Test**: Escrever código que tente registrar um nome ou e-mail de convidado em log e confirmar que a verificação automatizada sinaliza o caso.

**Acceptance Scenarios**:

1. **Given** o caminho padrão de registro de eventos, **When** uma mensagem de erro é emitida durante um fluxo de RSVP, **Then** nenhum campo de dado pessoal de convidado aparece na saída.
2. **Given** o documento de dados, **When** ele é consultado, **Then** cada campo pessoal previsto tem propósito e limite de retenção declarados.

---

### Edge Cases

- O que acontece quando a versão do runtime instalada na máquina difere da versão exigida pelo projeto? A instalação deve falhar com mensagem explícita indicando a versão esperada, e não com erro obscuro em tempo de execução.
- O que acontece quando alguém adiciona uma dependência nova sem justificativa? A revisão deve poder identificar a adição, e o documento de dependências deve registrar o motivo de cada uma.
- Como o projeto se comporta quando o armazenamento local ainda não foi inicializado? O comando de execução deve inicializá-lo automaticamente ou falhar com instrução direta de qual comando rodar.
- O que acontece se um teste ponta a ponta for interrompido no meio? O estado de armazenamento de teste deve ser isolado e descartável, de modo que a execução seguinte não herde dados sujos.
- Como a estrutura trata um teste intermitente (flaky)? Deve haver um local documentado para quarentena explícita e rastreada — nunca a exclusão silenciosa do teste, proibida pela constituição.
- O que acontece se a estrutura de pastas escolhida entrar em conflito com uma funcionalidade futura? A mudança de estrutura precisa ser tratada como alteração deliberada e documentada, não como reorganização ad hoc.

## Requirements *(mandatory)*

### Functional Requirements

**Execução e ambiente**

- **FR-001**: O projeto MUST ser executável localmente por meio de um único comando documentado, sem exigir nenhum serviço de nuvem externo.
- **FR-002**: O projeto MUST declarar explicitamente a versão de runtime exigida e falhar de forma legível quando ela não for atendida.
- **FR-003**: O projeto MUST fornecer um README na raiz contendo, no mínimo: pré-requisitos, comando de instalação, comando de execução, comando de teste e comando de verificação de qualidade.
- **FR-004**: O projeto MUST recarregar automaticamente a interface durante o desenvolvimento quando arquivos de origem forem alterados.

**Estrutura e arquitetura**

- **FR-005**: O projeto MUST definir e documentar uma estrutura de pastas que separe, no mínimo: interface de usuário, regras de negócio do domínio de RSVP, acesso a dados e testes.
- **FR-006**: As regras de negócio do domínio MUST NOT depender de código de interface nem de detalhes do mecanismo de armazenamento.
- **FR-007**: O projeto MUST documentar, em um arquivo versionado, a arquitetura adotada, as camadas, as direções de dependência permitidas e onde colocar cada tipo de código novo.
- **FR-008**: O projeto MUST tornar as direções de dependência entre camadas verificáveis automaticamente, de modo que uma violação reprove a verificação de qualidade.
- **FR-009**: A estrutura MUST acomodar os fluxos previstos pela constituição — visualizar convite, enviar RSVP, alterar RSVP e organizador visualizar respostas — sem exigir reorganização de pastas para adicioná-los.

**Testes**

- **FR-010**: O projeto MUST suportar e documentar três níveis de teste: unidade, contrato e ponta a ponta.
- **FR-011**: O projeto MUST expor um único comando que execute toda a suíte de testes e retorne código de saída diferente de zero em qualquer falha.
- **FR-012**: Os testes ponta a ponta MUST exercitar a aplicação contra armazenamento real, isolado por execução e descartável, e não contra substitutos da camada de persistência.
- **FR-013**: O projeto MUST incluir ao menos um teste executável de cada nível (unidade, contrato, ponta a ponta) já na estrutura inicial, servindo de exemplo replicável.
- **FR-014**: O projeto MUST reportar cobertura de testes de forma consultável por comando documentado.
- **FR-015**: O projeto MUST permitir executar um subconjunto de testes por caminho ou nome, para viabilizar o ciclo test-first sem esperar a suíte inteira.

**Qualidade e portão**

- **FR-016**: O projeto MUST expor um único comando de verificação que execute formatação, análise estática, checagem de tipos e testes, com veredito único.
- **FR-017**: O comando de verificação MUST ser o mesmo executado pelo portão de qualidade, de modo que aprovação local e aprovação no portão não divirjam.
- **FR-018**: O projeto MUST verificar acessibilidade automatizada das páginas voltadas ao convidado como parte da suíte de testes.

**Dependências**

- **FR-019**: O projeto MUST fixar versões de dependências de forma reprodutível, garantindo instalações idênticas entre máquinas.
- **FR-020**: O projeto MUST manter um registro versionado das dependências de execução adotadas, com o motivo de cada uma, conforme exige o princípio de simplicidade.
- **FR-021**: O projeto MUST NOT incluir na estrutura inicial dependências de terceiros que recebam dados pessoais de convidados.

**Privacidade e dados**

- **FR-022**: O projeto MUST oferecer um caminho padrão de registro de eventos que não emita dados pessoais de convidados.
- **FR-023**: O projeto MUST documentar, para cada campo pessoal previsto, o propósito e o limite de retenção.
- **FR-024**: O projeto MUST tratar identificadores de convite como valores não adivinháveis, e não como identificadores sequenciais.

### Key Entities

- **Módulo de Domínio**: Unidade que contém as regras de RSVP (quem foi convidado, qual a resposta, quando pode ser alterada). Não conhece interface nem armazenamento.
- **Módulo de Interface**: Unidade que apresenta as páginas ao convidado e ao organizador. Consome o domínio; não contém regra de negócio.
- **Módulo de Persistência**: Unidade responsável por gravar e ler respostas de forma durável e transacional. Implementa contratos definidos pelo domínio.
- **Suíte de Testes**: Conjunto organizado em três níveis (unidade, contrato, ponta a ponta), cada um com local, propósito e comando próprios.
- **Documento de Arquitetura**: Artefato versionado que descreve camadas, direções de dependência e regras de colocação de código novo.
- **Registro de Dependências**: Artefato versionado que lista cada dependência de execução adotada e a justificativa correspondente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa desenvolvedora que nunca viu o repositório consegue, seguindo apenas o README, ter a aplicação rodando localmente em menos de 10 minutos.
- **SC-002**: 100% dos comandos documentados no README executam com sucesso em um clone novo, sem passos manuais não documentados.
- **SC-003**: A suíte completa de testes executa em menos de 5 minutos em uma máquina de desenvolvimento típica, e o subconjunto de testes de unidade em menos de 30 segundos.
- **SC-004**: Cada um dos três níveis de teste tem pelo menos um exemplo funcional na estrutura inicial, e todos passam.
- **SC-005**: Dadas três peças de código novas (uma de interface, uma de regra de negócio, uma de acesso a dados), duas pessoas diferentes indicam o mesmo destino em 100% dos casos usando apenas o documento de arquitetura.
- **SC-006**: Uma violação intencional de direção de dependência entre camadas é reprovada pelo comando de verificação em 100% das tentativas.
- **SC-007**: O comando único de verificação produz o mesmo veredito localmente e no portão de qualidade em 100% das execuções comparadas.
- **SC-008**: Nenhum dado pessoal de convidado aparece na saída de registro de eventos ao exercitar todos os fluxos cobertos pelos testes ponta a ponta.
- **SC-009**: 100% dos campos pessoais previstos têm propósito e limite de retenção documentados.
- **SC-010**: Duas instalações independentes do projeto, a partir do mesmo estado do repositório, resultam em conjuntos idênticos de versões de dependências.

## Assumptions

- A stack é a governada pela constituição do projeto (React com Vite); a escolha concreta de bibliotecas de teste, análise estática, checagem de tipos e persistência é deliberação do `/speckit-plan`, não desta especificação.
- O público desta entrega é a equipe de desenvolvimento (incluindo agentes) — não há usuário final de negócio nesta funcionalidade.
- O escopo é a estrutura e os exemplos mínimos executáveis; nenhuma funcionalidade de RSVP voltada ao convidado é implementada aqui, apenas acomodada pela estrutura.
- O ambiente de desenvolvimento alvo é uma máquina local de desenvolvedor; provisionamento de infraestrutura de produção, publicação e monitoramento estão fora de escopo.
- O portão de qualidade automatizado (integração contínua) roda o mesmo comando único de verificação; a escolha do provedor é decisão de plano.
- O armazenamento usado em desenvolvimento e em testes é local e descartável, sem dependência de serviço externo, conforme exige a constituição.
- O projeto começa vazio: não há código legado, migração ou compatibilidade retroativa a preservar.
- Internacionalização, autenticação de organizador e envio de e-mails estão fora do escopo desta estrutura inicial, embora a arquitetura não deva impedi-los.
