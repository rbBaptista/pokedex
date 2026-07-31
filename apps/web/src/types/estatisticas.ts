// Formato devolvido por /api/admin/estatisticas.
export interface PokemonMaisCapturado {
  id: number
  nome: string
  totalCapturas: number
}

export interface Estatisticas {
  totalUsuarios: number
  totalCapturas: number
  mediaCapturasPorUsuario: number
  maisCapturados: PokemonMaisCapturado[]
}
