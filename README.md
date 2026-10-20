# agents-assets

Skills prontas para usar com agentes de IA no **Claude Code** e no **GitHub Copilot (VS Code)**.

Cada skill fica numa pasta em [skills/](skills/) com um `SKILL.md` (no formato aberto de Agent Skills, lido pelos dois) e os arquivos de apoio.

## Skills disponíveis

| Skill | O que faz | Requisitos |
|---|---|---|
| [confluence-docs](skills/confluence-docs/SKILL.md) | Escreve e revisa páginas do Confluence (how-tos, golden paths, referências, ADRs). Nunca altera o Confluence direto: prepara um rascunho local, abre o diff no VS Code e só publica o que você aprovou. | MCP da Atlassian configurado no agente; `code` no PATH para abrir os diffs. |
| [slides-padrao](skills/slides-padrao/SKILL.md) | Gera apresentações `.pptx` com identidade visual fixa (paleta, fontes, capa, rodapé, logo) a partir de um roteiro JSON. | Node.js 18+. Opcional: PowerPoint (Windows) ou LibreOffice, para conferir os slides como imagem. |

## Instalação

```bash
git clone <url-deste-repositório> ~/projetos/agents-assets
cd ~/projetos/agents-assets
./install.sh            # todas as skills, para Claude Code e Copilot
```

| Comando | Efeito |
|---|---|
| `./install.sh --list` | Lista as skills disponíveis. |
| `./install.sh slides-padrao` | Instala só as skills indicadas. |
| `./install.sh --claude` | Só para o Claude Code (`~/.claude/skills`). |
| `./install.sh --copilot` | Só para o Copilot (`~/.copilot/skills`). |
| `./install.sh --project ~/projetos/meu-repo` | Instala no repositório (`.claude/skills` e/ou `.github/skills`) em vez do diretório pessoal, para o time inteiro usar. |
| `./install.sh --link` | Cria links simbólicos em vez de copiar: um `git pull` aqui já atualiza as skills instaladas. |
| `./install.sh --uninstall [skill ...]` | Remove as skills do destino. |

Sem `--claude` nem `--copilot`, a skill vai só para `~/.claude/skills`: o Copilot também lê esse diretório, e instalar nos dois faria a skill aparecer duplicada. Use `--copilot` em máquinas sem o Claude Code.

O instalador é um script bash: no Windows, rode-o pelo WSL ou pelo Git Bash.

### Depois de instalar

- **Claude Code:** as skills aparecem na próxima sessão. Confira com `/skills`.
- **Copilot (VS Code):** as skills são usadas no modo agente do chat. Se não aparecerem, confira se as Agent Skills estão habilitadas nas configurações do Copilot.
- **slides-padrao:** antes do primeiro uso, rode `node scripts/setup.js` na pasta instalada da skill (o agente faz isso sozinho quando precisa). Ele instala as dependências npm e gera o exemplo como teste.

## Adicionar uma skill

1. Crie `skills/<nome>/SKILL.md` com o frontmatter `name` (igual ao nome da pasta) e `description` (o que a skill faz e quando usar: é o que o agente lê para decidir se a usa).
2. Coloque scripts, referências e exemplos na mesma pasta, com caminhos relativos a ela.
3. Não versione dependências instaladas (`node_modules/`) nem saídas geradas.
4. Acrescente a skill à tabela acima.
