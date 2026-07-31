// Middleware que exige que o usuário logado tenha papel ADMIN. Roda depois de
// `autenticacao` (precisa de req.usuarioId já preenchido). Lê o papel do
// banco a cada request, nunca do JWT — o token dura 7 dias e não é
// revogável, então confiar num papel assinado no login deixaria uma
// promoção/rebaixamento sem efeito até o token expirar sozinho (ver
// DECISOES.md).
// 403 (autenticado, mas sem permissão), não 401 (não autenticado) — a
// distinção é o que diferencia "faça login" de "você não pode fazer isso".
import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../prisma.ts'
import type { Papel } from '../types/papel.ts'

const ADMIN: Papel = 'ADMIN'

export async function apenasAdmin(req: Request, res: Response, next: NextFunction) {
  const usuarioId = req.usuarioId
  if (usuarioId === undefined) {
    res.status(401).json({ erro: 'Não autenticado.' })
    return
  }

  try {
    const usuario = await prisma.user.findUnique({
      where: { id: usuarioId },
      select: { papel: true },
    })

    if (usuario?.papel !== ADMIN) {
      res.status(403).json({ erro: 'Acesso restrito a administradores.' })
      return
    }

    next()
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ erro: 'Erro ao verificar permissão.' })
  }
}
