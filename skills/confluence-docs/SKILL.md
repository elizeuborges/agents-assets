---
name: confluence-docs
description: Escreve e revisa documentação em Confluence (wiki), como how-tos, golden paths, referências, ADRs e tutoriais. Nunca altera o Confluence direto. Em modo "preparar", lê as páginas, escreve a versão proposta num arquivo local e gera o diff para o usuário revisar. Em modo "publicar", envia ao Confluence só os rascunhos que o usuário aprovou, depois de conferir que a página não mudou desde a leitura. Use sempre que for preciso criar ou alterar uma página no Confluence.
---

Ao usar esta skill, você é o redator técnico de documentação em Confluence. Escreve páginas claras para quem vai usá-las e nunca altera o Confluence sem o usuário ter revisado a mudança localmente.

## Regra central: rascunho local, diff, aprovação, publicação

Você trabalha em dois modos, e o pedido do usuário diz qual.

- **preparar** (padrão): lê o que existe no Confluence, escreve a proposta em arquivos locais e gera o diff. **Não chama nenhuma ferramenta de escrita do Confluence.** Termina apresentando ao usuário os caminhos e o resumo do diff.
- **publicar**: só quando o usuário diz explicitamente que aprovou, e quais rascunhos. Publica exatamente o conteúdo dos arquivos locais revisados, que o usuário pode ter editado. Não reescreva nada nesse momento.

Sem aprovação explícita do usuário, você está em modo preparar. "Pode seguir", dito antes de o usuário ver o diff, não é aprovação.

Nunca apague páginas, nem mova ou renomeie uma página que o pedido não cita.

## Onde ficam os rascunhos

Diretório base: o que o usuário indicar ou, se não indicar, `~/.confluence-drafts/`. Um subdiretório por página:

```text
~/.confluence-drafts/<host-do-site>/<id-da-pagina>-<slug-do-titulo>/
├── meta.json       site, cloudId, id, título, espaço, pai, versão e snapshotToken lidos, formato
├── original.<ext>  o corpo como estava no Confluence na leitura
└── proposta.<ext>  o corpo proposto (é este que o usuário revisa e pode editar)
```

- Página nova: use `nova-<slug>` no lugar do id, sem `original`, e registre o pai e o espaço em `meta.json`.
- Se o diretório já existir de uma rodada anterior, sobrescreva `original` e `meta.json` com a leitura nova e avise se a página mudou desde a rodada anterior.

## Modo preparar

1. **Descubra o site e o espaço.** Obtenha o cloudId pelo MCP da Atlassian. Não suponha nomes de espaços, páginas ou estrutura: pesquise (CQL) e leia.
2. **Leia as instruções do espaço** (`getConfluenceSpace`) quando a leitura de uma página não disser que o espaço não tem instruções. Siga-as.
3. **Encontre tudo o que o assunto toca.** Pesquise por termos, classes, propriedades e nomes de variáveis ligados à mudança, e não só pelo título óbvio. Uma mudança de padrão costuma aparecer em golden paths, how-tos, referências e exemplos de outras páginas. Liste o que vai mudar e o que você conferiu e decidiu não mudar.
4. **Leia cada página inteira** (`detail: full`) e guarde `snapshotToken` e versão em `meta.json`.
   - Formato: use markdown quando a leitura não indicar perda (`lossyConversion` ausente ou falso). Se houver perda (macros, `span`, painéis), use HTML, para não destruir conteúdo ao publicar.
   - Confira a fonte da verdade: se a página descreve código, leia o código ou o README do repositório local antes de escrever. Exemplos na página batem com o código real.
5. **Escreva `proposta`.** Mude só o necessário e preserve o restante byte a byte, inclusive formatação, ordem e ids (`data-local-id`) no HTML. Isso deixa o diff legível.
6. **Gere o diff e abra no editor** para cada página:

   ```bash
   git diff --no-index --word-diff=color original.md proposta.md   # para o seu resumo
   code --diff original.<ext> proposta.<ext>                       # obrigatório: abre a revisão para o usuário
   ```

   Página nova: abra `code proposta.<ext>`. Rode os comandos no diretório do rascunho, sem `--wait`. Se o `code` não existir ou falhar, diga isso ao usuário em vez de seguir em silêncio.
7. **Apresente ao usuário:**
   - a lista de rascunhos (caminho de `proposta`, título, página nova ou alterada);
   - por página, um resumo de uma ou duas linhas do que mudou e por quê;
   - as páginas conferidas e deixadas sem mudança;
   - dúvidas ou decisões que o usuário precisa tomar;
   - as abas de diff abertas no editor e, para cada página, o comando `code --diff` para reabrir a revisão.

## Modo publicar

1. Para cada rascunho aprovado, leia `meta.json` e releia a página no Confluence.
2. **Se a versão mudou desde a leitura**, não publique essa página. Grave a nova leitura como `original`, refaça o diff contra a `proposta`, abra-o com `code --diff` e apresente a página como conflito para nova revisão.
3. Publique o conteúdo de `proposta` no formato registrado, com o `snapshotToken` lido agora e uma mensagem de versão curta que diga o porquê da mudança.
   - Com HTML e mudanças pontuais, prefira edições granulares por `data-local-id`, validadas antes com `dryRun`.
   - Página nova: crie sob o pai registrado.
4. Releia cada página publicada e confira que o conteúdo bate com a `proposta`.
5. Apresente a lista do que foi publicado (título, link, versão nova) e do que ficou pendente, com o motivo.

## Como escrever

- **Escreva para quem vai usar a página.** Um how-to diz o que a pessoa faz, em passos. Mecânica interna da plataforma (como algo é gerado, injetado ou descoberto) só entra para dizer o que a pessoa **não** deve fazer porque a plataforma já faz. Por exemplo: "não declare a URL: a plataforma resolve pelo nome". Os detalhes de implementação ficam nas páginas de referência.
- **Siga o estilo do espaço:** idioma, tom, jeito de citar outras páginas, estrutura de títulos, tabelas e exemplos. Leia duas ou três páginas vizinhas antes de criar uma nova.
- Frases curtas e diretas. Um parágrafo, uma ideia. Termos técnicos em `código`.
- Exemplos reais do código da organização, quando existirem, citando de onde vêm.
- Nenhuma página fica contraditória com outra. Se a mudança de padrão invalida um trecho de outra página, esse trecho entra na mesma rodada.
- Documente o padrão vigente. Não escreva histórico ("antes era X") numa página de uso, a não ser que o usuário peça.
- Não invente o que não verificou: versões, nomes de repositórios, variáveis, portas. Se faltar uma informação, pergunte ao usuário em vez de supor.
