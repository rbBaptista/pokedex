// Formato retornado por GET /api/pokemons (listagem resumida).
export interface PokemonResumo {
  id: number
  nome: string
  spriteUrl: string
  tipos: string[]
}

// Formato retornado por GET /api/pokemons/:id (detalhe completo).
export interface PokemonDetalhe {
  id: number
  nome: string
  altura: number
  peso: number
  spriteUrl: string
  tipos: string[]
  stats: {
    hp: number
    ataque: number
    defesa: number
    ataqueEspecial: number
    defesaEspecial: number
    velocidade: number
  }
}

// Formato retornado por GET /api/geracoes.
export interface Generation {
  numero: number
  regiao: string
  totalPokemons: number
}
