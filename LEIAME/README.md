# LEIAME — Guia de continuidade do MinePred

Este documento existe para que outra pessoa, equipe ou conversa de IA possa continuar o projeto sem precisar adivinhar decisões anteriores.

## 1. Projeto

- Repositório: https://github.com/vinisalves76-glitch/MiningControl
- Aplicação: MinePred — FPS Intelligence.
- Site de produção atual: https://minepred.vercel.app/
- Tecnologia atual: HTML, CSS e JavaScript puro, hospedados como site estático na Vercel.
- Idioma da interface: português do Brasil.

## 2. Regra obrigatória de trabalho

1. Antes de alterar código, leia este arquivo e o `README.md` da raiz.
2. Inspecione a implementação existente e confirme a branch atual.
3. Crie uma branch específica para cada mudança.
4. Faça alterações pequenas e explique o que mudou.
5. Teste a preview da Vercel antes de pedir aprovação.
6. **Não faça merge em `main` nem publique em produção sem autorização explícita do responsável.**
7. Nunca afirme que algo foi testado, implantado ou está funcionando sem verificar.

## 3. Estrutura dos arquivos

```text
/
├── index.html                  # Shell principal, navegação e carregamento das abas
├── README.md                   # Resumo e mapa do repositório
├── LEIAME/
│   └── README.md               # Este guia de continuidade
├── assets/
│   ├── css/
│   │   └── app.css             # Estilos compartilhados
│   └── js/
│       └── app.js              # Estado, cálculos e interações compartilhadas
└── pages/
    ├── dashboard/
    │   └── view.html           # Visão geral da frota
    ├── inspection/
    │   └── view.html           # Nova inspeção de FPS
    ├── history/
    │   └── view.html           # Histórico de inspeções
    ├── stock/
    │   └── view.html           # Estoque e previsão
    └── settings/
        └── view.html           # Parâmetros técnicos
```

## 4. Como as abas funcionam

`index.html` mantém a navegação lateral e o cabeçalho. Ao abrir o site, ele busca os cinco fragmentos HTML de `pages/*/view.html`, insere-os no elemento `#pagesContainer` e depois carrega `assets/js/app.js`.

Os fragmentos preservam os IDs usados pelo JavaScript atual. Se renomear um ID, atualize também as referências em `assets/js/app.js`. A lógica ainda é compartilhada: a separação atual é principalmente por arquivos e pastas, para facilitar a manutenção, sem reescrever as regras de negócio de uma vez.

## 5. Mapa de responsabilidades

- **Visão geral:** indicadores, componentes em atenção e gráfico de consumo.
- **Nova inspeção:** identificação da máquina/FPS, medições, condição visual e cálculo dimensional.
- **Histórico:** busca e visualização dos registros da sessão.
- **Estoque e previsão:** consumo médio, prazo de reposição, estoque de segurança e recomendação de compra.
- **Parâmetros técnicos:** limites de alerta e configurações de cálculo.
- **JavaScript compartilhado:** funções `showPage`, `calculateLife`, `renderDashboard`, `renderHistory`, `calculateStock`, `saveSettings` e estado da sessão.

## 6. Limitações atuais — não presumir que já foram resolvidas

- É um protótipo front-end; não possui backend, banco de dados ou autenticação.
- Registros e parâmetros ficam apenas na memória da sessão e são perdidos ao recarregar/fechar a página.
- Os dados iniciais são de demonstração.
- Fórmulas e limites de desgaste não substituem manuais do fabricante nem avaliação técnica.
- Não declarar o sistema pronto para uso operacional sem implementar persistência, controle de acesso, auditoria, backup e validação técnica.

## 7. Checklist antes de concluir uma mudança

- [ ] Alteração feita em branch, não diretamente em `main`.
- [ ] Abas e navegação carregam sem erros.
- [ ] Testados os fluxos afetados e a versão mobile.
- [ ] Conferidos console e logs disponíveis.
- [ ] Preview real da Vercel fornecida para avaliação.
- [ ] Limitações conhecidas documentadas.
- [ ] Nenhum merge ou deploy de produção sem aprovação explícita.

## 8. Instrução para uma nova conversa de IA

Comece lendo este arquivo, o `README.md`, `index.html`, `assets/js/app.js`, `assets/css/app.css` e os arquivos da aba que será alterada. Resuma a arquitetura e as limitações antes de editar. Preserve o comportamento existente, trabalhe numa branch, gere uma preview verificável e aguarde autorização antes de integrar em produção.

 
## 9. Novo módulo — máquinas, produtos e material rodante

### Arquivos adicionados
- `pages/catalog/view.html`: cadastro de máquinas, produtos/peças e listagem de pedidos de compra.
- `pages/undercarriage/view.html`: formulário de inspeção de material rodante, cálculo de desgaste e resumo de reposição.
- `assets/js/catalog.js`: lógica de interface para cadastro, vínculos máquina-peça, inspeções, ponto de pedido e rascunho de pedido.
- `database/migrations/001_minepred_inventory.sql`: proposta de schema PostgreSQL com máquinas, produtos, vínculo muitos-para-muitos, fornecedores, inspeções, medições, estoque, movimentos e pedidos.

### Modelo de dados proposto
`machines` e `products` são cadastros independentes. `machine_products` representa a compatibilidade e posição da peça em cada máquina. `inspections` identifica a inspeção/horímetro e `inspection_measurements` guarda uma medição por componente. Estoque é separado em saldo e movimentos; pedido de compra tem cabeçalho e itens.

### Estado e limites
A interface é demonstrativa e mantém cadastros, inspeções e pedidos em memória. Não existe API nem banco conectado. O SQL é um rascunho para revisão, não foi aplicado. Os valores de demonstração não são dados reais de máquinas. A previsão de vida útil só é calculada quando há inspeções anteriores comparáveis, com horímetro crescente e medida decrescente. Pedidos gerados na interface são rascunhos e não são enviados automaticamente.

### Regras de segurança
Antes de integrar: validar o schema e a chave de posição da relação máquina-peça; implementar API e autenticação; guardar histórico de medidas de referência por revisão; aprovar regras de criticidade, consumo, estoque de segurança e arredondamento com o responsável técnico/compras; incluir fluxo de aprovação antes de enviar pedidos.
