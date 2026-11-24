# Auditoria Inteligente de Fretes

## Solicitação atual
- [x] Criar a estrutura de cadastros, versões comerciais e importações no Lovable Cloud, com acesso restrito e sem replicar a base original de CT-es.
- [x] Vincular cadastros e importação ao banco, com login e validação de permissões; 13 testes passaram e o bloqueio sem login foi verificado no navegador.
- [ ] Validar gravação e importação com a conta administradora — aguarda primeiro login do responsável; não há usuários autenticados para emitir sessão de teste.
- [x] Adicionar Configurações ao rodapé do menu, com formulários de usuários e filiais, acesso ao cadastro existente de transportadoras e parâmetros previstos no escopo.
- [x] Preparar detalhamento flutuante do CT-e com decomposição lado a lado e acesso ao DACTE real; testes com registros isolados, sem dados fictícios no painel.
- [x] Atualizar apresentação conforme a referência enviada e validar navegação, formulários, recolhimento do menu e tamanhos de tela; sete testes aprovados e nenhuma falha observada no navegador.
- [ ] Consultar CT-es/DACTEs reais — aguarda acesso à fonte original; o banco de cadastros está conectado, mas não substitui os documentos originais.

- [x] Diagnosticar o projeto disponível e analisar o escopo e os logotipos enviados.
- [x] Confirmar onde está a base original de CT-es — usuário informou que está em uma base externa existente.
- [ ] Conectar a base externa original — aguarda acesso à fonte de CT-es; não criar base paralela.
- [x] Obter a referência HTML aprovada citada no escopo.
- [x] Reproduzir somente o layout aprovado, suas seis áreas e quatro abas, sem novas páginas ou recursos; manter dados vazios enquanto a base externa não estiver conectada.
- [x] Validar navegação, abertura das abas, inclusão visual de faixas e apresentação em computador, tablet e celular; teste de rotas aprovado.
- [x] Confirmar dados de perfil necessários antes de implementar autenticação — nome e equipe.

## Escopo integrado anterior — fora da solicitação atual de layout

Todos os itens abaixo dependem da conexão e inspeção da base externa original e de uma solicitação para retomar a integração.

- Estruturar dados e permissões preservando a base existente.
- Persistir Tabelas de Frete e suas versões.
- Implementar motor determinístico com memória de cálculo e testes.
- Implementar importação, validação e associação de faturas.
- Implementar auditorias de faturas e CT-es, detalhamento e exportações.
- Implementar alertas, tratativas e interpretação baseada em evidências.
- Integrar Visão Executiva com filtros, indicadores e gráficos reais.
- Validar fluxos completos, segurança e critérios de aceitação.
## Pendente
- [x] Aplicada migração: praças vinculadas a transportadoras + localidades (somente banco)
