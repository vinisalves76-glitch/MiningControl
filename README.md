# MiningControl

Plataforma de controle e análise para operações de mineração.

## Módulo: MinePred

Sistema de apoio à inspeção de ferramentas de penetração no solo (FPS), acompanhamento de desgaste e planejamento de estoque.

## Organização do código

- `index.html`: estrutura principal, navegação e carregamento das abas.
- `assets/css/app.css`: estilos compartilhados da aplicação.
- `assets/js/app.js`: lógica e interações compartilhadas.
- `pages/dashboard/view.html`: aba Visão geral.
- `pages/inspection/view.html`: aba Nova inspeção.
- `pages/history/view.html`: aba Histórico de inspeções.
- `pages/stock/view.html`: aba Estoque e previsão.
- `pages/settings/view.html`: aba Parâmetros técnicos.
- `LEIAME/README.md`: guia de continuidade para novos desenvolvedores ou chats.

## Como funciona o carregamento

A página principal busca as cinco abas em arquivos HTML separados e só então carrega o JavaScript compartilhado. As abas continuam usando os mesmos IDs e funções da versão anterior para minimizar alterações de comportamento.

## Desenvolvimento seguro

O trabalho deve ocorrer em branches. Não integrar alterações à `main` nem publicar em produção sem autorização explícita do responsável pelo projeto.

## Limitações conhecidas do protótipo

Os registros e parâmetros ficam apenas na memória da sessão do navegador; não há persistência em banco de dados nem autenticação. Os dados iniciais são demonstrativos. Limites técnicos e cálculos devem ser validados com os manuais aplicáveis e pela equipe responsável antes de qualquer uso operacional.
