// Configuração do Prisma CLI (migrate, generate, studio).
// A partir do Prisma 7 a URL do banco e o caminho do schema não ficam mais
// dentro do schema.prisma — ficam aqui.
import 'dotenv/config'
import path from 'node:path'
import { defineConfig, env } from 'prisma/config'

const diretorioAtual = import.meta.dirname

export default defineConfig({
  schema: path.join(diretorioAtual, '../../prisma/schema.prisma'),
  migrations: {
    path: path.join(diretorioAtual, '../../prisma/migrations'),
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
