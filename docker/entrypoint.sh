#!/bin/sh
set -e

echo "Running Prisma migrations..."
node ./node_modules/.bin/prisma migrate deploy

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "Running seed..."
  node prisma/seed.js
else
  echo "Skipping seed. Set RUN_SEED=true to seed this environment."
fi

echo "Starting API..."
exec node src/index.js
