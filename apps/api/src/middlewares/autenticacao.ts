// Middleware que protege uma rota: exige um cookie de login válido e anexa
// o id do usuário logado em req.usuarioId. Responde 401 se não tiver cookie
// ou se o token for inválido/expirado.
import type { NextFunction, Request, Response } from 'express'
import { verificarToken } from '../token.ts'

declare global {
  namespace Express {
    interface Request {
      usuarioId?: number
    }
  }
}

export function autenticacao(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token

  if (!token) {
    res.status(401).json({ erro: 'Não autenticado.' })
    return
  }

  try {
    req.usuarioId = verificarToken(token)
    next()
  } catch {
    res.status(401).json({ erro: 'Sessão inválida ou expirada.' })
  }
}
