# Verificar e configurar o ambiente

Leia este arquivo antes do primeiro uso da skill numa máquina (quando não existe `node_modules/` na pasta da skill) e sempre que um script falhar por dependência.

Todos os caminhos são relativos à pasta da skill.

```bash
node scripts/setup.js            # verifica, instala as dependências npm e gera o exemplo como teste
node scripts/setup.js --check    # só verifica, sem instalar nada
```

Se o comando `node` não for reconhecido, instale o Node.js 18+ (https://nodejs.org) antes de tudo.

## O que o script confere

Nesta ordem:

1. **Node.js 18+ e npm** (obrigatórios).
2. **Dependências npm** (obrigatórias): pptxgenjs, react, react-dom, react-icons e sharp. Instala com `npm install` se faltarem e confirma que o sharp carrega nesta plataforma.
3. **Identidade visual**: as 12 cores de `brand/tokens.json` são hex válidos e os arquivos de logo existem.
4. **Conferência visual** (opcional): se há PowerPoint (no Windows) ou LibreOffice para gerar imagens dos slides. No WSL, procura também o PowerPoint e o LibreOffice instalados no Windows. O setup só verifica; **nunca instale essas ferramentas na máquina de quem usa a skill**. Sem nenhuma delas, os decks são gerados normalmente e a conferência fica manual. Com o LibreOffice, confere também a fonte (ver abaixo).
5. **Teste de geração**: gera o exemplo num diretório temporário.

## Resultado

- Saída `0`: pronto para gerar decks. Volte ao fluxo padrão do `SKILL.md`.
- Saída `1`: o script lista os itens `[falta]`. Resolva-os e rode de novo antes de seguir.
- Itens `[aviso]` não impedem a geração.
- Se o `npm install` falhar por rede ou proxy, informe isso a quem pediu em vez de tentar outra forma de baixar os pacotes.

## Fonte na conferência visual

O deck usa a fonte de `brand/tokens.json` (Calibri, no exemplo). Quem abre no PowerPoint já tem a Calibri. Na conferência pelo LibreOffice, sem a Calibri, a quebra de linha das imagens pode diferir da do PowerPoint.

A pasta `fonts/` traz a Carlito (licença OFL, mesmas métricas da Calibri):

- **Linux:** o `render.js` usa a Carlito de `fonts/` sem instalar nada.
- **macOS:** se o setup avisar que a Calibri falta, instale os arquivos de `fonts/` (abrir cada `.ttf` e "Instalar"), com a concordância de quem usa a máquina.
- **Windows e WSL com programas do Windows:** o PowerPoint e o LibreOffice do Windows usam as fontes do Windows, que já têm a Calibri.
