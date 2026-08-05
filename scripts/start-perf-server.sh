#!/usr/bin/env bash
#
# Démarre un build de production local pour les mesures de performance.
#
# Le dossier `.next` est réservé à `next dev` : y lancer un `next build`
# pendant qu'un serveur de développement tourne corrompt le cache et provoque
# des 404 sur toutes les routes. Le build de mesure vise donc `.next-perf`
# (voir `distDir` dans `next.config.ts`), ce qui permet de mesurer sans
# interrompre le développement.
#
# L'API visée est la pile locale : la mesure isole le frontend au lieu de
# mesurer la latence d'un backend déployé.
set -euo pipefail

port="${PERF_PORT:-3200}"

export NEXT_DIST_DIR="${NEXT_DIST_DIR:-.next-perf}"
export NEXT_PUBLIC_API_URL="${PERF_API_URL:-http://localhost:3001/api/v1}"
export NEXT_PUBLIC_APP_URL="http://localhost:${port}"

if [ "${PERF_SKIP_BUILD:-0}" != "1" ]; then
  node ./node_modules/next/dist/bin/next build
fi

exec node ./node_modules/next/dist/bin/next start -p "$port"
