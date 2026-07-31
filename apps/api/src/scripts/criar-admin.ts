// Script para promover um usuário já cadastrado a ADMIN.
// Uso: npm run criar-admin -- email@exemplo.com
// Só mexe no banco (sem rota HTTP) — a pessoa precisa já ter se cadastrado
// pelo site antes de rodar isso.
import { normalizarEmail } from '../routes/auth.routes.ts'
import { prisma } from '../prisma.ts'
import type { Papel } from '../types/papel.ts'

const ADMIN: Papel = 'ADMIN'

async function main() {
  const emailBruto = process.argv[2]

  if (!emailBruto) {
    console.error('Uso: npm run criar-admin -- <email>')
    process.exit(1)
  }

  const email = normalizarEmail(emailBruto)
  const usuario = await prisma.user.findUnique({ where: { email } })

  if (!usuario) {
    console.error(
      `Nenhum usuário encontrado com o email "${email}". Ele precisa se cadastrar pelo site antes.`,
    )
    process.exit(1)
  }

  if (usuario.papel === ADMIN) {
    console.log(`${usuario.email} já é ADMIN.`)
    return
  }

  await prisma.user.update({ where: { id: usuario.id }, data: { papel: ADMIN } })
  console.log(`${usuario.email} agora é ADMIN.`)
}

main()
  .catch((erro) => {
    console.error(erro)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
