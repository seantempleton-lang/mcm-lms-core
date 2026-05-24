#!/usr/bin/env node
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { importModulePackage } from '../src/modulePackages.js';

function printUsage() {
  console.error('Usage: node scripts/import-module.js <module-package.json> [--dry-run] [--skip-resource-check]');
}

const args = process.argv.slice(2);
const filePath = args.find((arg) => !arg.startsWith('--'));
const dryRun = args.includes('--dry-run');
const checkResources = !args.includes('--skip-resource-check');

if (!filePath) {
  printUsage();
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const raw = await fs.readFile(filePath, 'utf8');
  const input = JSON.parse(raw);
  const result = await importModulePackage({ prisma, input, dryRun, checkResources });

  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 1;
} catch (error) {
  console.error(error?.message || error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
