#!/bin/sh
set -e

echo "Running Prisma migrations..."
node ./node_modules/.bin/prisma migrate deploy

echo "Running seed..."
node prisma/seed.js

echo "Starting API..."
exec node src/index.js