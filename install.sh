#!/usr/bin/env bash
# Instala as skills deste repositório para Claude Code e/ou GitHub Copilot (VS Code).
#
# Uso: ./install.sh [opções] [skill ...]
#   Sem nomes de skill, instala todas as que estão em skills/.
#
# Opções:
#   --claude          instala para o Claude Code (~/.claude/skills)
#   --copilot         instala para o Copilot no VS Code (~/.copilot/skills)
#   --project DIR     instala no repositório DIR em vez do diretório pessoal
#                     (DIR/.claude/skills e/ou DIR/.github/skills)
#   --link            cria links simbólicos em vez de copiar (um git pull já atualiza)
#   --uninstall       remove as skills indicadas do destino
#   --list            lista as skills disponíveis
#   -h, --help        mostra esta ajuda
#
# Sem --claude nem --copilot, instala para os dois. O Copilot também lê
# ~/.claude/skills (e .claude/skills num repositório), então, com os dois
# alvos, a skill é instalada só no diretório do Claude, para não aparecer
# duplicada no Copilot.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="$REPO_DIR/skills"

claude=false
copilot=false
project=""
link=false
uninstall=false
skills=()

usage() { sed -n '2,/^$/{s/^# \{0,1\}//;p}' "${BASH_SOURCE[0]}"; }

available() {
  for d in "$SKILLS_DIR"/*/; do
    [[ -f "$d/SKILL.md" ]] && basename "$d"
  done
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --claude) claude=true ;;
    --copilot) copilot=true ;;
    --project)
      [[ $# -ge 2 ]] || { echo "erro: --project precisa de um diretório" >&2; exit 1; }
      project="$2"; shift ;;
    --link) link=true ;;
    --uninstall) uninstall=true ;;
    --list) available; exit 0 ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "erro: opção desconhecida: $1" >&2; usage >&2; exit 1 ;;
    *) skills+=("$1") ;;
  esac
  shift
done

if ! $claude && ! $copilot; then
  claude=true
  copilot=true
fi

if [[ ${#skills[@]} -eq 0 ]]; then
  mapfile -t skills < <(available)
fi

for s in "${skills[@]}"; do
  if [[ ! -f "$SKILLS_DIR/$s/SKILL.md" ]]; then
    echo "erro: skill não encontrada: $s (veja ./install.sh --list)" >&2
    exit 1
  fi
done

if [[ -n "$project" ]]; then
  [[ -d "$project" ]] || { echo "erro: diretório não existe: $project" >&2; exit 1; }
  project="$(cd "$project" && pwd)"
  claude_dest="$project/.claude/skills"
  copilot_dest="$project/.github/skills"
else
  claude_dest="$HOME/.claude/skills"
  copilot_dest="$HOME/.copilot/skills"
fi

# Com os dois alvos, o diretório do Claude atende também o Copilot.
# Na remoção, limpa todos os destinos selecionados.
targets=()
$claude && targets+=("$claude_dest")
$copilot && { ! $claude || $uninstall; } && targets+=("$copilot_dest")

for dest in "${targets[@]}"; do
  mkdir -p "$dest"
  for s in "${skills[@]}"; do
    target="$dest/$s"
    if $uninstall; then
      if [[ -e "$target" || -L "$target" ]]; then
        rm -rf "$target"
        echo "removida: $target"
      fi
      continue
    fi
    rm -rf "$target"
    if $link; then
      ln -s "$SKILLS_DIR/$s" "$target"
      echo "link:     $target -> $SKILLS_DIR/$s"
    else
      cp -R "$SKILLS_DIR/$s" "$target"
      echo "copiada:  $target"
    fi
  done
done

if $claude && $copilot && ! $uninstall; then
  echo
  echo "O Copilot lê $claude_dest, então não foi preciso instalar em $copilot_dest."
fi
