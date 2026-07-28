// Cria e verifica o token (JWT) usado pra manter o usuário logado.
// O token vai dentro de um cookie httpOnly — ver middlewares/autenticacao.ts.
import 'dotenv/config'
import jwt from 'jsonwebtoken'

const SEGREDO = process.env.JWT_SECRET!
const DURACAO = '7d'

export function criarToken(usuarioId: number): string {
  return jwt.sign({ usuarioId }, SEGREDO, { expiresIn: DURACAO })
}

export function verificarToken(token: string): number {
  const payload = jwt.verify(token, SEGREDO) as { usuarioId: number }
  return payload.usuarioId
}
