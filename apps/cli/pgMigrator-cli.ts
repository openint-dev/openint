#!/usr/bin/env tsx
import '@openint/app-config/register.node'
import path from 'node:path'
import {makePostgresClient} from '@openint/connector-postgres'
import {z} from '@openint/util'

void makePostgresClient({
  databaseUrl: z.string().parse(process.env['POSTGRES_OR_WEBHOOK_URL']),
  migrationsPath: path.join(__dirname, '../web/migrations'),
  migrationTableName: '_migrations',
}).runMigratorCli()
