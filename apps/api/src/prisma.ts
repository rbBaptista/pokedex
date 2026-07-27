// Client único do Prisma, compartilhado por toda a API (rotas e scripts).
// Usa o adapter do better-sqlite3 porque, a partir do Prisma 7, toda conexão
// com o banco precisa passar por um "driver adapter".
import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './generated/prisma/client.ts'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })

export const prisma = new PrismaClient({ adapter })
