#!/bin/sh
set -e

echo "Running prisma migrate deploy..."
node ./node_modules/.bin/prisma migrate deploy

echo "Starting API..."
exec node src/index.js
