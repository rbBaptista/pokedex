import type { Papel } from './papel'

// Formato devolvido por /api/auth/register, /login e /me.
export interface Usuario {
  id: number
  nome: string
  email: string
  papel: Papel
}
