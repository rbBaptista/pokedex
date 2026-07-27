// Formato retornado por GET /api/pokemons (listagem resumida).
export interface PokemonResumo {
  id: number
  nome: string
  spriteUrl: string
  tipos: string[]
}
