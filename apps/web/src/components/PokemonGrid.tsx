import { usePokemons } from '../hooks/usePokemons'
import PokemonCard from './PokemonCard'

function PokemonGrid() {
  const { pokemons, carregando, erro } = usePokemons()

  if (carregando) {
    return <p className="py-8 text-center text-neutral-500">Carregando Pokémon...</p>
  }

  if (erro) {
    return <p className="py-8 text-center text-red-600">{erro}</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {pokemons.map((pokemon) => (
        <PokemonCard key={pokemon.id} pokemon={pokemon} />
      ))}
    </div>
  )
}

export default PokemonGrid
