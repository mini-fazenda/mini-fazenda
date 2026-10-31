#!/usr/bin/env bash
# Roda cada teste de navegador mesmo que um falhe e publica o erro como anotação do GitHub
# (assim dá para ler o motivo pela API, sem baixar o log inteiro).
# Uso: scripts/run-browser-tests.sh tests/a.cjs tests/b.cjs ...
failed=0
for t in "$@"; do
  out=$(node "$t" 2>&1); code=$?
  echo "$out"
  if [ $code -ne 0 ]; then
    failed=1
    msg=$(echo "$out" | grep -v '^\s*at ' | tail -6 | tr '\n' ' ' | cut -c1-900)
    echo "::error title=Falhou $t (${MF_BROWSER:-chromium})::$msg"
  fi
done
exit $failed
