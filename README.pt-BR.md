<div align="center">

# opencode-favorites

Favoritos com escopo para mensagens da IA no OpenCode.

[English](README.md) | [Português (Brasil)](README.pt-BR.md)

</div>

Este projeto foi criado para as extensões TUI customizadas do [`opencode-foundry`](https://github.com/lucas-rulez/opencode-foundry). Um favorito mantém tanto a referência da mensagem original quanto uma cópia do conteúdo visível da resposta, permanecendo disponível mesmo depois da compactação ou remoção do histórico.

Cada mensagem pode ter no máximo um favorito:

- `session`: visível somente na sessão de origem.
- `project`: visível em sessões com o mesmo ID de projeto.
- `global`: visível em qualquer sessão.

Clicar no escopo ativo remove o favorito. Clicar em outro escopo move diretamente o favorito existente para o novo escopo.

O plugin persiste os favoritos localmente e oferece navegação por escopo na sidebar do TUI.

## Demonstração

O plugin adiciona as três ações de favorito diretamente aos metadados da mensagem da IA:

![Favoritos do OpenCode nos metadados da mensagem da IA](docs/images/print-opencode-favorites.png)

O escopo ativo aparece com um marcador verde. Selecionar outro escopo move diretamente o favorito, enquanto selecionar o escopo ativo remove o favorito.

A sidebar com favoritos cadastrados em vários escopos:

![Sidebar de favoritos do OpenCode com vários favoritos salvos](docs/images/print-opencode-sidebar.png)

A sidebar também inclui uma seção recolhível `FAVS` com toggles independentes para `Session`, `Project` e `Global`. Escopos vazios ficam ocultos, cada snapshot é exibido em uma única linha truncada, e a sidebar é atualizada imediatamente ao adicionar ou remover favoritos. As mensagens favoritadas são exibidas atualmente apenas; o comportamento ao selecionar uma mensagem será definido em uma etapa posterior.

## Compatibilidade

A integração com o TUI exige uma versão do OpenCode com o slot `message_metadata` e o componente `Action` fornecido pelo host. Essas capacidades estão sendo desenvolvidas no fork [`opencode-foundry`](https://github.com/lucas-rulez/opencode-foundry).

Depois de fazer o build do pacote, configure o `tui.json` do fork:

```json
{
  "plugin": [
    "opencode-favorites/tui"
  ]
}
```
