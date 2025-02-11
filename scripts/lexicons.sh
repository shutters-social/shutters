#!/usr/bin/env bash

SHUTTERS_ROOT="$(dirname $(dirname ${BASH_SOURCE[@]}))"

bunx @atcute/lex-cli generate \
  --output "${SHUTTERS_ROOT}/packages/lexicons/src/atcute.ts" \
  --description "Shutters.social Lexicons" \
  "${SHUTTERS_ROOT}"/lexicons/social/shutters/**/*.json
